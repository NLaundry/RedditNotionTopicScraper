import { Client } from "@notionhq/client"
import fetch from 'node-fetch'
import Request from 'request'
import Headers from 'request'

const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID
const SMMRY_KEY = process.env.SMMRY_KEY

const subreddit = 'technology'
const limit = 20
const timeframe = 'week' //hour, day, week, month, year, all
const listing = 'top' //controversial, best, hot, new, random, rising, top
const summary_length = 4
const summary_keywords = 5


async function get_reddit(subreddit, listing, limit, timeframe) {
	const baseURL = `https://www.reddit.com/r/${subreddit}/${listing}.json?limit=${limit}&t=${timeframe}`
	let response = await fetch(baseURL)
	let data = await response.json()
	let posts = data.data.children
	return posts
}

async function parse_posts(posts) {
	let parsed_posts = []
	for (let post of posts) {
		let data = post.data
		let summary = ""
		try {
			summary = await get_summary(data.url, summary_length, summary_keywords)
			summary = summary.sm_api_content
		} finally {
		}
		let entry = {
			"title": data.title,
			"url": data.url,
			"summary": summary,
		}
		parsed_posts.push(entry)
	}
	return parsed_posts
}

async function get_summary(url, length, keywordCount){
	const baseURL = `https://api.smmry.com/&SM_API_KEY=${SMMRY_KEY}&SM_LENGTH=${length}&SM_KEYWORD_COUNT=${keywordCount}&SM_URL=${url}`
	let response = await fetch(baseURL)
	let data = await response.json()
	return data
}

async function addItem(title, url, summary) {
  try {
	const entry = {
      "parent": { "database_id": databaseId },
      "properties": {
			"title": {
				"type": "title",
				"title": [
					{
						"type": "text",
						"text": {
							"content": title,
						},
					},
				],
			},
			url: {
				"type": "url",
				"url": url,
			},
			summary: {
				// "type": "rich_text",
				rich_text: [
					{
						"type": "text",
						"text": {
							"content": summary,
							"link": null
						},
						"plain_text": summary,
						"href": null
					},
				],
			},
      },
    }

    const response = await notion.pages.create(entry)
    console.log(response)
    console.log("Success! Entry added.")
  } catch (error) {
    console.error(error.body)
  }
}

async function main(){
	let posts = await get_reddit(subreddit, listing, limit, timeframe)
	let parsed_posts = await parse_posts(posts)

	for (let post of parsed_posts) {
		await addItem(post.title, post.url, post.summary)
	}
}

main()