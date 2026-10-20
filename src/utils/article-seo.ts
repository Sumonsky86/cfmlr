/** JSON-LD is data, never executable markup, even inside an HTML script tag. */
export function serializeJsonLd(value: Record<string, unknown>): string {
    return JSON.stringify(value).replace(/</g, '\\u003c');
}
