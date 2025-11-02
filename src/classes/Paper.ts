import { Client, EmbedBuilder, ThreadChannel } from "discord.js";

interface IPaperData {
    Title: string,
    Link: string,
    DOI: string,
    Image: string,
}

export class Paper {
    async scrap(client: Client<true>) {
        // set thread channel
        const paperThread = await client.channels.fetch(process.env['PAPER_THREAD']) as ThreadChannel
        // get paper data based on source
        const paperSources = ['nature']
        let i = 0
        setInterval(async () => {
            const [paperData, paperError] = await this.getPaper<IPaperData[]>(paperSources[i])
            // failed to get paper
            if(paperError) {

            }
            // success getting paper
            else {
                // set paper stuff
                const paperDate = new Date().toLocaleString([], {weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'})
                const paperTitle = `Today's Paper - ${paperDate}`
                const paperSource = `**SOURCE: ${paperSources[i]}**`
                // set paper content
                const paperHead = i === 0 ? `${paperTitle}\n- ${paperSource}` : `- ${paperSource}`
                // send paper head
                paperThread.send(paperHead)

                // loop paper data
                for(let paper of paperData) {
                    // ### UNTUK SOURCE = nature 
                    // ### HANYA PERLU DATA = doi, link
                    // ### YANG LAIN PERLU = title, doi, link, image
                    // set article data
                    const articleTitle = `> - ${paper.Title}`
                    const articleDOI = `> - DOI: ${paper.DOI}`
                    const articleLink = `${paper.Link}`
                    const articleImage = paper.Image
                    // merge article data as string
                    const paperBody = `${articleTitle}\n${articleLink}\n${articleDOI}\n${articleImage}`
                    // send paper body
                    paperThread.send(`@silent ${paperBody}`)
                }
            }
            // paper counter
            i++
            // reset counter if all sources has been fetched
            if(i === paperSources.length) i = 0
        }, 30_000);
    }

    private async getPaper<T>(source: string): Promise<[T, any]> {
        // fetch paper data
        const paperEndpoint = `http://localhost:8080/api/${source}`
        const paperResponse = await (await fetch(paperEndpoint)).json()
        switch(paperResponse.Status) {
            case 200:
                return [paperResponse.Data, null]
            default:
                return [null as T, paperResponse.Message]
        }
    }
}