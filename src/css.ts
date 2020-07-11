
export function ifClass(condition: boolean, className: string): string {
    return condition ? " " + className : "";
}