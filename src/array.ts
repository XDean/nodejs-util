export function arrayRemove<T>(array: Array<T>, value: T) {
    let index = array.indexOf(value);
    if (index !== -1) {
        array.splice(index);
    }
}