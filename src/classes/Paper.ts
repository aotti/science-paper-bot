import { Client, EmbedBuilder, MessageFlags, ThreadChannel } from "discord.js";

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
    async scrap(client: Client<true>) {
        // set thread channel
        const paperThread = await client.channels.fetch(process.env['PAPER_THREAD']) as ThreadChannel
        // get paper data based on source
        const paperSources: IPaperSource[] = [
            {name: 'Nature', endpoint: 'nature', param: ''},
            {name: 'ACS Pubs - Applied Materials & Interfaces', endpoint: 'acs', param: '1'},
            {name: 'ACS Pubs - Inorganic Chemistry', endpoint: 'acs', param: '2'},
            {name: 'ACS Pubs - Organometallics', endpoint: 'acs', param: '3'},
        ]
        let i = 0
        const paperInterval = setInterval(async () => {
            const [paperData, paperError] = await this.getPaper<IPaperData[]>(paperSources[i])
            // stop interval after all paper sent
            if(i === paperSources.length) return clearInterval(paperInterval)
            // failed to get paper, stop interval
            if(paperError) {
                paperThread.send(paperError)
                return clearInterval(paperInterval)
            }
            // success getting paper
            else {
                // set paper stuff
                const paperDate = new Date().toLocaleString([], {weekday: 'long', day: 'numeric', month: 'short', year: 'numeric'})
                const paperTitle = `Today's Paper - ${paperDate}`
                const paperSource = `**SOURCE: ${paperSources[i].name}**`
                // set paper content
                const paperHead = i === 0 ? `${paperTitle}\n- ${paperSource}` : `- ${paperSource}`
                // send paper head
                paperThread.send(paperHead)
                // send paper body
                this.setPaperBody(paperSources[i].name, paperData).forEach(v => {
                    // paperThread.send({content: v, flags: MessageFlags.SuppressNotifications})
                    const paperEmbed = new EmbedBuilder()
                    paperEmbed.setTitle(v.Title)
                    paperEmbed.setDescription(`${v.Link}\nDOI: ${v.DOI}`)
                    paperEmbed.setImage(v.Image)
                    paperThread.send({embeds: [paperEmbed],  flags: MessageFlags.SuppressNotifications})
                })
            }
            // paper counter
            i++
        }, 120_000);
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
}