/**
 * @typedef {import('express').Response & CustomResponse} ExtendedResponse
 *
 * @typedef {Object} CustomResponse
 * @property {(message: string, resultData?: any, statusCode?: number, code?: string, success?: boolean) => void} response
 */
