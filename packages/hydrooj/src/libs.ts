import AdmZip from 'adm-zip';
import _ from 'lodash';
import Schema from 'schemastery';
import superagent from 'superagent';
import { Context } from './context';
export { ObjectID, ObjectId, FilterQuery } from 'mongodb';
export { WebSocket, WebSocketServer } from 'ws';
export * from './utils';
export * from './interface';
export * from './typeutils';
export {
    Schema, AdmZip, superagent, _,
};
export const definePlugin = <T = never>(args: {
    using?: keyof Context[];
    apply: (ctx: Context, config: T) => Promise<void> | void;
    schema?: Schema<T>;
    name?: string;
}) => args;
