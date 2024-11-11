import type { Response } from "./response"

export type ErrorResponse = Response & {
    type: "validation" | "server" | "authentication",
    on: "body" | "query" | "params" | "cookies" | "internal",
    property?: string,
    message: string
}

export function error(type: ErrorResponse["type"], on: ErrorResponse["on"], property: ErrorResponse["property"] | null = null, message: ErrorResponse["message"]): ErrorResponse {
    return {
        success: false,
        type: type,
        on: on,
        property: property || undefined,
        message: message
    }
}