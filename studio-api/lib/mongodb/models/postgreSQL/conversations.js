const debug = require('debug')('linto:conversation-manager:lib:mongodb:models:postgreSQL:conversations')

const MongoModel = require(`../../model`)
const public_projection = { token: 0 }
const aggregator = require(`${process.cwd()}/lib/mongodb/models/postgreSQL/utility/aggregator`)

const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)
const RIGHTS = require(`${process.cwd()}/lib/dao/conversation/rights`)

const util = require('util');

class ConversationsPostgreHandler extends MongoModel {

    constructor() {
        super('conversations')
    }

    async getSharedConvFromOrga(idOrga, userId) {
        let lconversation = await this.mongoRequest(
            { "organization.organizationId": idOrga.toString() },
            { _id: 1, sharedWithUsers: 1, organization: 1 }
        )
        lconversation = lconversation.filter(conversation => {
            if (conversation.sharedWithUsers) {
                let right = conversation.sharedWithUsers.find(right => right.userId === userId)
                if (right) return conversation
            }
        })

        return lconversation
    }
    async listConvFromOrga(organizationId, userId, userRole, desiredAccess = 1, filter) {
        let query = {
            "organization.organizationId": organizationId.toString()
        }
        if (filter.tags && filter.filter === 'notags')
            query.tags = { $nin: filter.tags } // notags rules don't apply for highlighs category
        else if (filter.tags)
            query.tags = { $all: filter.tags.split(',') }

        if (filter.name && filter.text) {
            query.$or = [
                { name: { $regex: filter.name, $options: 'i' } },
                { 'text.raw_segment': { $regex: filter.text, $options: 'i' } }
            ]
        } else {
            if (filter.name)
                query.name = { $regex: filter.name, $options: 'i' };
            if (filter.text)
                query['text.raw_segment'] = { $regex: filter.text, $options: 'i' };
        }

        if (filter.tags && filter.filter !== 'notags')
            query.tags = { $all: filter.tags.split(',') }

        let lconversation = await this.mongoRequest(
            query,
            { page: 0, text: 0, token: 0, "jobs.transcription.job_logs": 0 }
        )

        lconversation = lconversation.filter(conversation => {
            if (conversation.organization.customRights) {
                let right = conversation.organization.customRights.find(right => right.userId === userId)
                if (right) return (right && right.right & desiredAccess)
            }
            // check if in converation access
            if (userRole === ROLES.MEMBER) return conversation.organization.membersRight & desiredAccess
            else if (userRole > ROLES.MEMBER) return true
        })

        return aggregator(lconversation, filter)
    }

    async listConvFromConvIds(convIds, userId, userRole, desiredAccess = 1, filter = {}) {
        let lconversation = await this.mongoRequest(
            { "_id": { $in: convIds } },
            public_projection
        )
        lconversation = lconversation.filter(conversation => {
            if (conversation.organization.customRights) {
                let right = conversation.organization.customRights.find(right => right.userId === userId)
                if (right) return (right && right.right & desiredAccess)
            }
            if (conversation.sharedWithUsers) {
                let right = conversation.sharedWithUsers.find(right => right.userId === userId)
                if (right) return (right && right.right & desiredAccess)
            }
            // check if in converation access
            if (userRole === ROLES.MEMBER) return conversation.organization.membersRight & desiredAccess
            else if (userRole > ROLES.MEMBER) return true
        })
        return aggregator(lconversation, filter)
    }
}

module.exports = new ConversationsPostgreHandler()