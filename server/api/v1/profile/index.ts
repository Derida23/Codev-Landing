import { abouts, abouts__id, experiences, projects } from "~/constants"

import {
  getQuery,
} from 'h3'

export default defineEventHandler(async (event) => {

  const queryParam = getQuery(event)
  console.log(queryParam.lang)

  const data = {
    abouts: queryParam.lang === 'id' ? abouts__id : abouts,
    experiences,
    projects
  }

  return {
    data,
    message: 'Success retrieve data',
    meta: {
      pagination: {
        limit: 10,
        page: 1,
        total: 100,
      },
    },
  }
})
