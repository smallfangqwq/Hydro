import { dirname, resolve } from 'path';
import { PassThrough, Readable } from 'stream';
import { URL } from 'url';
import {
    CopyObjectCommand, DeleteObjectCommand, DeleteObjectsCommand,
    GetObjectCommand, HeadObjectCommand, PutObjectCommand, PutObjectCommandInput, S3Client,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
    copyFile, createReadStream, createWriteStream, ensureDir,
    existsSync, remove, stat, writeFile,
} from 'fs-extra';
import { lookup } from 'mime-types';
import { Logger } from '../logger';
import { builtinConfig } from '../settings';
import { MaybeArray } from '../typeutils';
import { md5, streamToBuffer } from '../utils';

const logger = new Logger('storage');

interface StorageOptions {
    endPoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
    region?: string;
    pathStyle: boolean;
    endPointForUser?: string;
    endPointForJudge?: string;
}

function parseAlternativeEndpointUrl(endpoint: string): (originalUrl: string) => string {
    if (!endpoint) return (originalUrl) => originalUrl;
    const pathonly = endpoint.startsWith('/');
    if (pathonly) endpoint = `https://localhost${endpoint}`;
    const url = new URL(endpoint);
    if (url.hash || url.search) throw new Error('Search parameters and hash are not supported for alternative endpoint URL.');
    if (!url.pathname.endsWith('/')) throw new Error("Alternative endpoint URL's pathname must ends with '/'.");
    return (originalUrl) => {
        const parsedOriginUrl = new URL(originalUrl);
        const replaced = new URL(parsedOriginUrl.pathname.slice(1) + parsedOriginUrl.search + parsedOriginUrl.hash, url).toString();
        return pathonly
            ? replaced.replace('https://localhost', '')
            : replaced;
    };
}
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent
export function encodeRFC5987ValueChars(str: string) {
    return (
        encodeURIComponent(str)
            // Note that although RFC3986 reserves "!", RFC5987 does not,
            // so we do not need to escape it
            .replace(/['()]/g, escape) // i.e., %27 %28 %29
            .replace(/\*/g, '%2A')
            // The following are not required for percent-encoding per RFC5987,
            // so we can allow for a little better readability over the wire: |`^
            .replace(/%(?:7C|60|5E)/g, unescape)
    );
}

const convertPath = (p: string) => {
    p = p.trim();
    if (p.includes('..') || p.includes('//') || p.endsWith('/.') || p === '.' || p.includes('/./')) {
        throw new Error('Invalid path');
    }
    return p;
};

class RemoteStorageService {
    public client: S3Client;
    public error = '';
    public opts: StorageOptions;
    private replaceWithAlternativeUrlFor: Record<'user' | 'judge', (originalUrl: string) => string>;

    async start() {
        try {
            logger.info('Starting storage service with endpoint:', builtinConfig.file.endPoint);
            const {
                endPoint,
                accessKey,
                secretKey,
                bucket,
                region,
                pathStyle,
                endPointForUser,
                endPointForJudge,
            } = builtinConfig.file;
            this.opts = {
                endPoint,
                accessKey,
                secretKey,
                bucket,
                region,
                pathStyle,
                endPointForUser,
                endPointForJudge,
            };
            this.client = new S3Client({
                endpoint: this.opts.endPoint,
                region: this.opts.region,
                forcePathStyle: this.opts.pathStyle,
                credentials: {
                    accessKeyId: this.opts.accessKey,
                    secretAccessKey: this.opts.secretKey,
                },
            });
            this.replaceWithAlternativeUrlFor = {
                user: parseAlternativeEndpointUrl(this.opts.endPointForUser),
                judge: parseAlternativeEndpointUrl(this.opts.endPointForJudge),
            };
            logger.success('Storage connected.');
            this.error = null;
        } catch (e) {
            logger.warn('Storage init fail. will retry later.');
            if (process.env.DEV) logger.warn(e);
            this.error = e.toString();
            setTimeout(() => this.start(), 10000);
        }
    }

    async put(target: string, file: string | Buffer | Readable, meta: Record<string, string> = {}) {
        target = convertPath(target);
        if (typeof file === 'string') file = createReadStream(file);
        const params: PutObjectCommandInput = {
            Bucket: this.opts.bucket,
            Key: target,
            Body: file,
            Metadata: meta,
            ContentType: meta['Content-Type'] || 'application/octet-stream',
        };
        if (file instanceof Buffer && file.byteLength <= 5 * 1024 * 1024) {
            await this.client.send(new PutObjectCommand(params));
        } else {
            const upload = new Upload({
                client: this.client,
                params,
                tags: [],
                queueSize: 4,
                partSize: 1024 * 1024 * 5,
                leavePartsOnError: false,
            });
            await upload.done();
        }
    }

    async get(target: string, path?: string) {
        target = convertPath(target);
        const res = await this.client.send(new GetObjectCommand({
            Bucket: this.opts.bucket,
            Key: target,
        }));
        if (!res.Body) throw new Error();
        const stream = res.Body as Readable;
        if (path) {
            await new Promise((end, reject) => {
                const file = createWriteStream(path);
                stream.on('error', reject);
                stream.on('end', () => {
                    file.close();
                    end(null);
                });
                stream.pipe(file);
            });
            return null;
        }
        const p = new PassThrough();
        stream.pipe(p);
        return p;
    }

    async del(target: string | string[]) {
        if (typeof target === 'string') target = convertPath(target);
        else target = target.map(convertPath);
        if (typeof target === 'string') {
            return await this.client.send(new DeleteObjectCommand({
                Bucket: this.opts.bucket,
                Key: target,
            }));
        }
        return await this.client.send(new DeleteObjectsCommand({
            Bucket: this.opts.bucket,
            Delete: {
                Objects: target.map((i) => ({ Key: i })),
            },
        }));
    }

    /** @deprecated use StorageModel.list instead. */
    async list() {
        throw new Error('listObjectsAPI was no longer supported in hydrooj@4. Please use hydrooj@3 to migrate your files first.');
    }

    async getMeta(target: string) {
        target = convertPath(target);
        const res = await this.client.send(new HeadObjectCommand({
            Bucket: this.opts.bucket,
            Key: target,
        }));
        return {
            size: res.ContentLength,
            lastModified: res.LastModified,
            etag: res.ETag,
            metaData: res.Metadata,
        };
    }

    async signDownloadLink(target: string, filename?: string, noExpire = false, useAlternativeEndpointFor?: 'user' | 'judge'): Promise<string> {
        target = convertPath(target);
        const url = await getSignedUrl(this.client, new GetObjectCommand({
            Bucket: this.opts.bucket,
            Key: target,
            ResponseContentDisposition: filename ? `attachment; filename="${encodeRFC5987ValueChars(filename)}"` : '',
        }), {
            expiresIn: noExpire ? 24 * 60 * 60 * 7 : 10 * 60,
        });
        if (useAlternativeEndpointFor) return this.replaceWithAlternativeUrlFor[useAlternativeEndpointFor](url);
        return url;
    }

    async signUpload(target: string, size: number) {
        const { url, fields } = await createPresignedPost(this.client, {
            Bucket: this.opts.bucket,
            Key: target,
            Conditions: [
                { $key: target },
                { acl: 'public-read' },
                { bucket: this.opts.bucket },
                ['content-length-range', size - 50, size + 50],
            ],
            Fields: {
                acl: 'public-read',
            },
            Expires: 600,
        });
        return {
            url: this.replaceWithAlternativeUrlFor.user(url),
            fields,
        };
    }

    async copy(src: string, target: string) {
        src = convertPath(src);
        target = convertPath(target);
        return await this.client.send(new CopyObjectCommand({
            Bucket: this.opts.bucket,
            Key: target,
            CopySource: src,
        }));
    }
}

class LocalStorageService {
    client: null;
    error: null;
    dir: string;
    opts: null;
    private replaceWithAlternativeUrlFor: Record<'user' | 'judge', (originalUrl: string) => string>;

    async start() {
        logger.debug('Loading local storage service with path:', builtinConfig.file.path);
        await ensureDir(builtinConfig.file.path);
        this.dir = builtinConfig.file.path;
        this.replaceWithAlternativeUrlFor = {
            user: parseAlternativeEndpointUrl(builtinConfig.file.endPointForUser),
            judge: parseAlternativeEndpointUrl(builtinConfig.file.endPointForJudge),
        };
    }

    async put(target: string, file: string | Buffer | Readable) {
        target = resolve(this.dir, convertPath(target));
        await ensureDir(dirname(target));
        if (typeof file === 'string') await copyFile(file, target);
        else if (file instanceof Buffer) await writeFile(target, file);
        else await writeFile(target, await streamToBuffer(file));
    }

    async get(target: string, path?: string) {
        target = resolve(this.dir, convertPath(target));
        if (!existsSync(target)) throw new Error('File not found');
        if (path) await copyFile(target, path);
        return createReadStream(target);
    }

    async del(target: MaybeArray<string>) {
        const targets = (typeof target === 'string' ? [target] : target).map(convertPath);
        await Promise.all(targets.map((i) => remove(resolve(this.dir, i))));
    }

    async getMeta(target: string) {
        target = resolve(this.dir, convertPath(target));
        const file = await stat(target);
        return {
            size: file.size,
            etag: Buffer.from(target).toString('base64'),
            lastModified: file.mtime,
            metaData: {
                'Content-Type': (target.endsWith('.ans') || target.endsWith('.out'))
                    ? 'text/plain'
                    : lookup(target) || 'application/octet-stream',
                'Content-Length': file.size,
            },
        };
    }

    async signDownloadLink(target: string, filename = '', noExpire = false, useAlternativeEndpointFor?: 'user' | 'judge'): Promise<string> {
        target = convertPath(target);
        const url = new URL('https://localhost/storage');
        url.searchParams.set('target', target);
        if (filename) url.searchParams.set('filename', filename);
        const expire = (Date.now() + (noExpire ? 7 * 24 * 3600 : 600) * 1000).toString();
        url.searchParams.set('expire', expire);
        url.searchParams.set('secret', md5(`${target}/${expire}/${builtinConfig.file.secret}`));
        if (useAlternativeEndpointFor) return this.replaceWithAlternativeUrlFor[useAlternativeEndpointFor](url.toString());
        return `/${url.toString().split('localhost/')[1]}`;
    }

    async signUpload() {
        throw new Error('Not implemented');
    }

    async list() {
        throw new Error('deprecated');
    }

    async copy(src: string, target: string) {
        src = resolve(this.dir, convertPath(src));
        target = resolve(this.dir, convertPath(target));
        await copyFile(src, target);
        return { etag: target, lastModified: new Date() };
    }
}

let service; // eslint-disable-line import/no-mutable-exports

export async function loadStorageService() {
    service = builtinConfig.file.type === 's3' ? new RemoteStorageService() : new LocalStorageService();
    global.Hydro.service.storage = service;
    await service.start();
}

export default new Proxy({}, {
    get(self, key) {
        return service[key];
    },
}) as RemoteStorageService | LocalStorageService;
