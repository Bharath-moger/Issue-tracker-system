export function fail(status, message) { return Object.assign(new Error(message), { status }); }
export function ok(res, message, data, status = 200) { return res.status(status).json({ success: true, message, ...(data === undefined ? {} : { data }) }); }
