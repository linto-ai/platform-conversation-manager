const debug = require('debug')('linto:conversation-manager:lib:mongodb:models:postgreSQL:utility:aggregator')

module.exports = function aggregator(list, filter) {
    let default_sort_field = 'last_update'
    let default_sort_criteria = '-1'

    if (!filter.sortField) filter.sortField = default_sort_field
    if (!filter.sortCriteria) filter.sortCriteria = default_sort_criteria
    
    if(filter.sortCriteria === '1') list.sort((a, b) => new Date(a[filter.sortField]) - new Date(b[filter.sortField]))
    else list.sort((a, b) => new Date(b[filter.sortField]) - new Date(a[filter.sortField]))

    const startIndex = filter.page * filter.size
    const endIndex = (filter.page + 1) * filter.size
    const list_filtered = list.slice(startIndex, endIndex)

    return {
        count: list.length,
        list: [...list_filtered]
    }
}