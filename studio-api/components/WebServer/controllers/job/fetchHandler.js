const debug = require("debug")(
  "linto:components:WebServer:controller:fetchHandler",
)
const axios = require(`${process.cwd()}/lib/utility/axios`)

const model = require(`${process.cwd()}/lib/mongodb/models`)
const { handleResult } = require(
  `${process.cwd()}/components/WebServer/controllers/job/resultHandler`,
)

async function fetchLogs(host, job) {
  try {
    return await axios.get(`${host}/job-log/${job.job_id}`)
  } catch (err) {
    debug(`Error while fetching job logs: ${err}`)
    return // A job doesn't exist all the time
  }
}

async function fetchJob(conv_id, conv_job) {
  try {
    let job_queue = Object.keys(conv_job)
      .filter(
        (key) =>
          // We just want to fetch job that are not done or error and have a job_id
          !conv_job[key]?.result_id &&
          conv_job[key]?.job_id &&
          conv_job[key]?.state !== "error",
      )
      .map((key) => ({
        endpoint: conv_job[key].endpoint,
        job_id: conv_job[key].job_id,
        type: key,
      }))

    if (job_queue.length === 0) return

    job_queue = await Promise.all(
      job_queue.map(async (job) => {
        const host = `${process.env.GATEWAY_SERVICES}/${job.endpoint}`
        let current_job = job
        let logs
        try {
          let job_info = await axios.get(`${host}/job/${job.job_id}`)

          if (job_info.state === "error") {
            logs = await fetchLogs(host, job)
            logs !== undefined ? (current_job.job_logs = logs) : undefined
          }

          if (job_info.state === "done" && job_info.result_id) {
            await fetchResult(conv_id, { ...job, ...job_info })
          }

          current_job = {
            ...current_job,
            ...job_info, // job_info can update job previous state, that's why it's after
          }
        } catch (err) {
          if (current_job.job_log === undefined) {
            logs = await fetchLogs(host, job)
            logs !== undefined ? (current_job.job_logs = logs) : undefined
          } else logs !== undefined ? (current_job.job_logs = logs) : undefined
          current_job.state = "error"
        }
        return current_job
      }),
    )

    await updateJobConversation(conv_id, conv_job, job_queue)
  } catch (err) {
    debug(`Error during job update : ${err}`)
  }
}

async function fetchResult(conv_id, job) {
  try {
    const conversation = await model.conversations.getById(conv_id)

    const result = await getResult(job, conversation[0].metadata)
    if (job.state === "done" && job.result_id) {
      await handleResult(result, job, conversation[0])
    }
  } catch (err) {
    debug(`Error while handling result: ${err}`)
    throw err
  }
}

async function getResult(job, metadata) {
  try {
    let url = `${process.env.GATEWAY_SERVICES}/${job.endpoint}/results/${job.result_id}`
    const isWhisper =
      metadata.transcription?.transcriptionConfig?.modelType === "whisper"
    if (
      !isWhisper &&
      metadata.transcription.transcriptionConfig.enableNormalization &&
      metadata.transcription.lang !== "*"
    ) {
      url += "?convert_numbers=true"
    }

    const options = { headers: { accept: "application/json" } }

    return await axios.get(url, options)
  } catch (err) {
    debug(`Error while fetching result: ${err}`)
    throw err
  }
}

async function updateJobConversation(conv_id, conv_job, job_queue) {
  job_queue.map((job) => {
    conv_job[job.type] = {
      ...conv_job[job.type],
      ...job,
    }
    delete conv_job[job.type].type
  })

  await model.conversations.updateJob(conv_id, conv_job)
}

module.exports = { fetchJob }
