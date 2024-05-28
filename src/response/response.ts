export type Response = {
    success: boolean
}

export type Success = Response & {
    success: true,
    message: string,
    redirect?: string,
    data?: any
}

export function response(message: string, data: any, redirect?: string): Success {
    return {
        success: true,
        message,
        data,
        redirect
    }
}