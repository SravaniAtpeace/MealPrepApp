export function stubUserMiddleware(req,_,next){
    req.user = {_id : 'demo-user'};

    // middleware should always continue to the next middleware/route and if this is not enforced by calling next, it will be a bug and request hangs
    next();
}