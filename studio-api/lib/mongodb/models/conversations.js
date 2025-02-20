const MongoModel = require(`../model`)
const debug = require("debug")(
  "linto:conversation-manager:models:mongodb:models:conversations",
)

const moment = require("moment")
const ROLES = require(`${process.cwd()}/lib/dao/organization/roles`)
const RIGHTS = require(`${process.cwd()}/lib/dao/conversation/rights`)
const TYPE = require(`${process.cwd()}/lib/dao/conversation/types`)
class ConvoModel extends MongoModel {
  constructor() {
    super("conversations")
  }

  async create(conversation) {
    try {
      const dateTime = moment().format()
      conversation.created = dateTime
      conversation.last_update = dateTime

      return await this.mongoInsert(conversation)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async update(payload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(payload._id),
      }

      if (payload.organizationId) delete payload.organizationId

      const dateTime = moment().format()
      payload.last_update = dateTime

      delete payload._id
      let mutableElements = payload

      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getConvos() {
    try {
      const query = {}
      const projection = {
        text: 0,
        speakers: 0,
        keywords: 0,
        highlights: 0,
      }

      return await this.mongoRequest(query, projection)
    } catch (error) {
      console.error(error)
      return errorMonitor
    }
  }

  async getConversationFromParent(id, projectionArray) {
    try {
      let query = {
        "type.from_parent_id": id,
      }

      let projection = {}
      if (projectionArray) {
        projectionArray.map((element) => {
          projection[element] = 1
        })
      }

      return await this.mongoRequest(query, projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getByIdWithFilter(convId, projection) {
    try {
      const query = {
        _id: this.getObjectId(convId),
      }

      return await this.mongoRequest(query, projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async getById(convoId, projectionArray) {
    try {
      const query = {
        _id: this.getObjectId(convoId),
      }
      let projection = {}
      if (projectionArray) {
        projectionArray.map((element) => {
          projection[element] = 1
        })
      }
      return await this.mongoRequest(query, projection)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  // list conversation shared to the user
  async getByShare(idUser, filter = undefined) {
    try {
      let projection = {
        text: 0,
        speakers: 0,
        keywords: 0,
        highlights: 0,
        "jobs.transcription.job_logs": 0,
      }

      const query = {
        "type.mode": TYPE.CANONICAL,
        sharedWithUsers: {
          $elemMatch: {
            userId: idUser.toString(),
            right: { $bitsAnySet: RIGHTS.READ }, // Only get conversation where user has read access
          },
        },
      }

      if (filter?.name) {
        query.name = {
          $regex: filter.name,
          $options: "i",
        }
      }

      if (filter?.description) {
        query.description = {
          $regex: filter.description,
          $options: "i",
        }
      }
      if (filter?.tags) {
        filter.tags = filter.tags.split(",")
        query.tags = {
          $all: filter.tags,
        }
      }

      if (filter?.text) {
        query["text.raw_segment"] = {
          $regex: filter.text,
          $options: "i",
        }
      }

      if (!filter) return await this.mongoRequest(query, projection)
      else return await this.mongoAggregatePaginate(query, projection, filter)
    } catch (err) {
      console.error(err)
      return err
    }
  }

  async getTagByOrga(idOrga, tags) {
    const query = {
      "organization.organizationId": idOrga.toString(),
    }
    if (tags) {
      tags = tags.split(",")
      query.tags = {
        $all: tags,
      }
    }

    const projection = {
      tags: 1,
    }

    return await this.mongoRequest(query, projection)
  }

  async getTagByShare(idUser, filter = undefined) {
    const query = {
      sharedWithUsers: {
        $elemMatch: {
          userId: idUser.toString(),
        },
      },
    }
    if (filter.tags) {
      filter.tags = filter.tags.split(",")
      query.tags = {
        $elemMatch: {
          $in: filter.tags,
        },
      }
    }

    const projection = {
      tags: 1,
      name: 1,
    }

    return await this.mongoRequest(query, projection)
  }

  // list conversation from an organization id
  async getConvoByOrga(idOrga) {
    getByOrga(idOrga)
  }

  async getByOrga(idOrga, projection) {
    try {
      const query = {
        "organization.organizationId": idOrga.toString(),
        "type.mode": TYPE.CANONICAL,
      }
      if (!projection) {
        projection = {
          text: 0,
          speakers: 0,
          keywords: 0,
          highlights: 0,
        }
      }
      return await this.mongoRequest(query, projection)
    } catch (err) {
      console.error(err)
      return err
    }
  }

  async getSharedConvFromOrga(idOrga, idUser) {
    try {
      const query = {
        "organization.organizationId": idOrga.toString(),
        "type.mode": TYPE.CANONICAL,
        sharedWithUsers: {
          $elemMatch: {
            userId: idUser.toString(),
          },
        },
      }
      return await this.mongoRequest(query, {
        _id: 1,
        sharedWithUsers: 1,
        organization: 1,
      })
    } catch (err) {
      console.error(err)
      return err
    }
  }

  async listConversationByOrgaRole(
    idOrga,
    role,
    projection,
    filter = undefined,
  ) {
    try {
      const query = {
        "organization.organizationId": idOrga.toString(),
      }
      if (!projection) {
        projection = {
          text: 0,
          speakers: 0,
          keywords: 0,
          highlights: 0,
        }
      }
      return await this.mongoRequest(query, projection)
    } catch (err) {
      console.error(err)
      return err
    }
  }

  async updateConvOnTranscriptionResult(_id, conversation) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(_id),
      }

      let mutableElements = {
        speakers: conversation.speakers,
        text: conversation.text,
        metadata: conversation.metadata,
        jobs: conversation.jobs,
      }

      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async updateJob(_id, jobPayload) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(_id),
      }
      let mutableElements = {
        jobs: { ...jobPayload },
      }
      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async updateTurn(_id, text) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(_id),
      }
      const dateTime = moment().format()
      let mutableElements = {
        text: [...text],
        last_update: dateTime,
      }

      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async updateCategory(_id, category) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(_id),
      }
      let mutableElements = {
        category: [...category],
      }

      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async updateTag(_id, tags) {
    try {
      const operator = "$set"
      const query = {
        _id: this.getObjectId(_id),
      }
      let mutableElements = {
        tags: [...tags],
      }

      return await this.mongoUpdateOne(query, operator, mutableElements)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async delete(id) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }
      return await this.mongoDelete(query)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async deleteTag(orgaId, tags) {
    try {
      const query = {
        "organization.organizationId": orgaId.toString(),
      }
      const operator = "$pull"

      let tagIds = tags
      if (typeof tags === "string") tagIds = tags.split(",")

      const values = {
        tags: {
          $in: tagIds,
        },
      }
      return await this.mongoUpdateMany(query, operator, values)
    } catch (err) {}
  }

  async addSharedUser(id, shared) {
    try {
      const query = {
        _id: this.getObjectId(id),
      }
      const operator = "$addToSet"
      const values = {
        sharedWithUsers: shared,
      }
      return await this.mongoUpdateOne(query, operator, values)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  // Default right is 1 (read)
  async listConvFromOrga(
    organizationId,
    userId,
    userRole,
    desiredAccess = 1,
    filter,
  ) {
    try {
      let projection = {
        page: 0,
        text: 0,
        "jobs.transcription.job_logs": 0,
      }

      let query = {
        "organization.organizationId": organizationId.toString(),
        "type.mode": TYPE.CANONICAL,
        $or: [
          {
            "organization.customRights": {
              $elemMatch: {
                userId: userId,
                right: { $bitsAnySet: desiredAccess },
              },
            },
          },
          {
            "organization.customRights": {
              $not: {
                $elemMatch: {
                  userId: userId,
                },
              },
            },
          },
        ],
      }

      if (filter.tags && filter.filter === "notags") {
        // notags rules don't apply for highlighs category
        query.tags = {
          $nin: filter.tags,
        }
      } else if (filter.tags) {
        query.tags = {
          $all: filter.tags.split(","),
        }
      }
      if (filter.name) {
        query.name = {
          $regex: filter.name,
          $options: "i",
        }
      }
      if (filter.tags && filter.filter !== "notags") {
        query.tags = {
          $all: filter.tags.split(","),
        }
      }
      if (filter.text) {
        query["text.raw_segment"] = {
          $regex: filter.text,
          $options: "i",
        }
      }

      if (userRole === ROLES.MEMBER) {
        // A member can only see conversation where he has access
        query["$or"][1]["organization.membersRight"] = {
          $bitsAnySet: desiredAccess,
        }
      }

      return await this.mongoAggregatePaginate(query, projection, filter)
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listConvFromConvIds(
    convIds,
    userId,
    userRole,
    desiredAccess = 1,
    filter = {},
  ) {
    try {
      convIds = convIds.map((id) => {
        if (typeof id === "string") return this.getObjectId(id)
        else return id
      })

      let query = {
        _id: {
          $in: convIds,
        },
        "type.mode": TYPE.CANONICAL,
        $or: [
          {
            "organization.customRights": {
              $elemMatch: {
                userId: userId,
                right: { $bitsAnySet: desiredAccess },
              },
            },
          },
          {
            "organization.customRights": {
              $not: {
                $elemMatch: {
                  userId: userId,
                },
              },
            },
          },
          {
            sharedWithUsers: {
              $elemMatch: {
                userId: userId,
                right: { $bitsAnySet: desiredAccess },
              },
            },
          },
        ],
      }

      if (userRole === ROLES.MEMBER) {
        // A member can only see conversation where he has access
        query["$or"][1]["organization.membersRight"] = {
          $bitsAnySet: desiredAccess,
        }
      }

      return await this.mongoAggregatePaginate(
        query,
        {
          page: 0,
          ...filter,
        },
        filter,
      )
    } catch (error) {
      console.error(error)
      return error
    }
  }

  async listConvFromFavorite(convIds, filter) {
    try {
      let projection = {
        page: 0,
        text: 0,
        "jobs.transcription.job_logs": 0,
      }

      convIds = convIds.map((id) => {
        if (typeof id === "string") return this.getObjectId(id)
        else return id
      })

      let query = {
        _id: {
          $in: convIds,
        },
        "type.mode": TYPE.CANONICAL,
      }

      if (filter.tags) {
        query.tags = {
          $all: filter.tags.split(","),
        }
      }

      if (filter.text) {
        query["text.raw_segment"] = {
          $regex: filter.text,
          $options: "i",
        }
      }

      if (filter.name) {
        query.name = {
          $regex: filter.name,
          $options: "i",
        }
      }

      return await this.mongoAggregatePaginate(query, projection, filter)
    } catch (error) {
      console.error(error)
      throw error
    }
  }

  async listConvFromAccess(
    convIds,
    userId,
    orgaId,
    userRole,
    desiredAccess = 1,
    filter = {},
  ) {
    try {
      convIds = convIds.map((id) => {
        if (typeof id === "string") return this.getObjectId(id)
        else return id
      })

      let query = {
        _id: {
          $in: convIds,
        },
        "type.mode": TYPE.CANONICAL,
        $or: [
          {
            sharedWithUsers: {
              $elemMatch: {
                userId: userId,
                right: { $bitsAnySet: desiredAccess },
              },
            },
          },
        ],
      }

      if (userRole && userRole > ROLES.UNDEFINED) {
        query["$or"].push({
          "organization.organizationId": orgaId,
          "organization.customRights": {
            $elemMatch: {
              userId: userId,
              right: { $bitsAnySet: desiredAccess },
            },
          },
        })
        query["$or"].push({
          "organization.organizationId": orgaId,
          "organization.customRights": {
            $not: {
              $elemMatch: {
                userId: userId,
              },
            },
          },
        })

        if (userRole === ROLES.MEMBER)
          // A member can only see conversation where he has access
          query["$or"][2]["organization.membersRight"] = {
            $bitsAnySet: desiredAccess,
          }
      }

      return await this.mongoRequest(query, filter)
    } catch (error) {
      console.error(error)
      return error
    }
  }
}

module.exports = new ConvoModel()
