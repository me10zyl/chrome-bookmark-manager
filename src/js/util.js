export function groupBy(array, keyMapper) {
    return array.reduce((result, currentValue) => {
        (result[keyMapper.call(this, currentValue)] = result[keyMapper.call(this, currentValue)] || []).push(currentValue);
        return result;
    }, {});
}