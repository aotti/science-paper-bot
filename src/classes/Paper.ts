import { Client, EmbedBuilder, MessageFlags, ThreadChannel } from "discord.js";
import paper_sources from "../lib/paper-sources.json" with {type: 'json'}
import RedisClient from "../lib/redis.js";

interface IPaperData {
    Title: string,
    Link: string,
    DOI: string,
    Image: string,
}

interface IPaperSource {
    name: string,
    endpoint: string,
    param: string,
}

export class Paper {
    #redisClient = RedisClient()

    async scrap(client: Client<true>) {
        // set thread channel
        const paperThread = await client.channels.fetch(process.env['PAPER_THREAD']) as ThreadChannel
        // get posted paper
        const getPostedPapers = await this.#redisClient.get('postedPapers') as string[]
        console.log({getPostedPapers});
        
        // get paper data based on source
        const paperSources = paper_sources.list as IPaperSource[]
        let i = 0
        const paperInterval = 5 * 60 * 1000 // minutes, seconds, miliseconds
        const paperLoop = setInterval(async () => {
            const [paperData, paperError] = await this.getPaper<IPaperData[]>(paperSources[i])
            // stop interval after all paper sent
            if(i === paperSources.length) return clearInterval(paperLoop)
            // failed to get paper, stop interval
            if(paperError) {
                paperThread.send(paperError)
                return clearInterval(paperLoop)
            }
            // success getting paper
            else {
                // set paper stuff
                const paperDate = new Date().toLocaleString([], {weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'})
                const paperTitle = `Today's Paper - ${paperDate}`
                const paperSource = `==================================\n- **SOURCE: ${paperSources[i].name}**`
                // set paper content
                const paperHead = i === 0 ? `${paperTitle}\n${paperSource}` : `${paperSource}`
                // send paper head
                paperThread.send(paperHead)
                // send paper body
                const paperList = this.setPaperBody(paperSources[i].name, paperData)
                for(let paper of paperList) {
                    // check if paper still fresh
                    if(getPostedPapers && getPostedPapers?.length > 0) {
                        const isPosted = getPostedPapers.indexOf(paper.Link)
                        // paper is posted
                        if(isPosted !== -1) {
                            console.log(`${paper.Title.slice(0, 30)}.. paper already posted`);
                            continue
                        }
                    }
                    // set paper embed
                    const paperEmbed = new EmbedBuilder()
                    paperEmbed.setTitle(paper.Title)
                    paperEmbed.setDescription(`${paper.Link}\nDOI: ${paper.DOI}`)
                    paperEmbed.setImage(paper.Image)
                    paperThread.send({embeds: [paperEmbed],  flags: MessageFlags.SuppressNotifications})
                    // save posted paper to redis
                    await this.updatePostedPaper(paper.Link)
                }
            }
            // paper counter
            i++
        }, paperInterval);
    }

    private async getPaper<T>(source: IPaperSource): Promise<[T, any]> {
        // fetch paper data
        const paperEndpoint = `http://localhost:8080/api/${source.endpoint}/${source.param}` 
        const paperResponse = await (await fetch(paperEndpoint)).json()
        switch(paperResponse.Status) {
            case 200:
                return [paperResponse.Data, null]
            default:
                return [null as T, paperResponse.Message]
        }
    }

    private setPaperBody(source: string, paperData: IPaperData[]) {
        const paperBody = [] as IPaperData[]
        // loop paper data
        for(let paper of paperData) {
            // set article data
            const articleTitle = paper.Title
            const articleDOI = paper.DOI
            const articleLink = `${paper.Link}`
            const articleImage = paper.Image
            // merge article data as string
                paperBody.push({Title: articleTitle, DOI: articleDOI, Link: articleLink, Image: articleImage})
        }
        return paperBody
    }
    
    private async updatePostedPaper(url: string) {
        const getPostedPapers = await this.#redisClient.get('postedPapers') as string[]
        // database still empty
        if(!getPostedPapers || getPostedPapers?.length === 0) {
            // set posted paper
            await this.#redisClient.set('postedPapers', [url])
        }
        else {
            const filterPostedPapers = [...getPostedPapers, url].filter((v,i,arr) => arr.indexOf(v) === i)
            // update posted paper
            await this.#redisClient.set('postedPapers', filterPostedPapers)
        }
    }
}