import { Client } from "@notionhq/client"
import fetch from 'node-fetch'

const notion = new Client({ auth: process.env.NOTION_KEY })
const databaseId = process.env.NOTION_DATABASE_ID

const subreddit = 'technology'
const limit = 20
const timeframe = 'week' //hour, day, week, month, year, all
const listing = 'top' //controversial, best, hot, new, random, rising, top


async function get_reddit(subreddit, listing, limit, timeframe) {
	const baseURL = `https://www.reddit.com/r/${subreddit}/${listing}.json?limit=${limit}&t=${timeframe}`
	let response = await fetch(baseURL)
	let data = await response.json()
	let posts = data.data.children
	return posts
}

function parse_posts(posts) {
	let parsed_posts = []
	for (let post of posts) {
		let data = post.data
		parsed_posts.push(JSON.parse(`{"title": "${data.title}","url": "${data.url}"}`))
	}
	return parsed_posts
}

async function addItem(title, url) {
  try {
    const response = await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
			'title': {
				type: 'title',
				title: [
					{
						type: 'text',
						text: {
							content: title,
						},
					},
				],
			},
			url: {
				type: 'url',
				url: url,
			},
      },
    })
    console.log(response)
    console.log("Success! Entry added.")
  } catch (error) {
    console.error(error.body)
  }
}

let posts = await get_reddit(subreddit, listing, limit, timeframe)
let parsed_posts = parse_posts(posts)
console.log(parsed_posts)

for (let post of parsed_posts) {
	addItem(post.title, post.url)
}
