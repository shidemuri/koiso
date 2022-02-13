const {Client,MessageEmbed}= require('discord.js') 
const ytdl = require('ytdl-core-discord')
const search = require('scrape-youtube').default
const ytpl = require('ytpl')

const client = new Client({ws:{properties:{$browser:'Discord iOS'}}})

const prefixo = '!!'

client.on('ready', () => {
    console.log('koiso momento xdddd')
    setInterval(function(){
    client.user.setActivity('!!help - ' + process.env.status)},5000)
})

const fila = new Object()

function convert(millis) {
    var minutes = Math.floor(millis / 60000);
    var seconds = ((millis % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

async function tocar(con, url, ch, id, skip){
    try{
    if(!fila[con.channel.guild.id]) fila[con.channel.guild.id] = []
    if(url){
        if(ytdl.validateURL(url)) {
            if(id){ //evita q a mensagem seja enviada quando troca de musica
            if(!skip){
            const thee = await ytdl.getBasicInfo(url)
            fila[con.channel.guild.id].push([thee.videoDetails.video_url, thee.videoDetails.title, thee.videoDetails.lengthSeconds*1000]) 
            const embeed = new MessageEmbed()
            .setColor(`#18ebf2`)
            .setTitle('Música adicionada')
            .setDescription(`[${thee.videoDetails.title}](${thee.videoDetails.video_url})`)
            ch.send(embeed)
            }}
        } else if(await ytpl.validateID(url)){
            const playlist = await ytpl(url)
            for(const a of playlist.items) fila[con.channel.guild.id].push([a.shortUrl, a.title, a.durationSec*1000])
            const porraaa = new MessageEmbed()
            .setColor(`#18ebf2`)
            .setTitle('Playlist added')
            .setDescription(`Added ${playlist.items.length} items from [${playlist.title}](${playlist.url})`)
            ch.send(porraaa)
            url = fila[con.channel.guild.id][0]
        } else {
            const resultados = await search.search(url, {type: "video"})
            const videoslegal = []
            for(let i = 0; i < 5; i++) {
                const a = resultados.videos[i]
                videoslegal.push((resultados.videos.indexOf(a)+1)+" - "+`[${a.title}](${a.link})`);
            }
            const emojis = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣']
            const vidros = new MessageEmbed()
            .setTitle('choose a video')
            .setDescription(videoslegal.join(`\n`))
            .setColor(`#18ebf2`)
            const porra = await ch.send(vidros)
            for(const a of emojis) porra.react(a)
            const video = await porra.awaitReactions((emojo, pessoa) => emojis.includes(emojo.emoji.name) && pessoa.id == id, {time: 30000, max: 1})
            url = [resultados.videos[emojis.indexOf(video.first().emoji.name)].link, resultados.videos[emojis.indexOf(video.first().emoji.name)].title, (await ytdl.getBasicInfo(resultados.videos[emojis.indexOf(video.first().emoji.name)].link)).videoDetails.lengthSeconds*1000]
            fila[con.channel.guild.id].push(url)
            const porro = new MessageEmbed()
            .setColor(`#18ebf2`)
            .setTitle('Song chosen')
            .setDescription(`${Number(emojis.indexOf(video.first().emoji.name))+1} - [${url[1]}](${url[0]})`)
            ch.send(porro)
        }
    } else url = fila[con.channel.guild.id][0]
    if(!con.dispatcher) { //dispatcher é basicamente o q o client tá reproduzindo em um canal de voz
        const merda = con.play(await ytdl(url), {type:"opus"})
        con.dispatcher.setVolume(0.6)
        const somuchembeds = new MessageEmbed()
        let penus = ''
        if((await ytdl.getBasicInfo(url)).videoDetails.author.id == 'UCvy_1uRgNNu-h3JJCJOGfpw') penus = `\n kinoshita EEEEEEEEE <a:rin:898369672385273907> <a:miku:898369704790458379> <:una:898369681910558742>`
        somuchembeds.setColor(`#18ebf2`)
        .setTitle("Agora tocando:")
        .setDescription(`[${fila[con.channel.guild.id][0][1]}](${fila[con.channel.guild.id][0][0]})${penus}`)
        ch.send(somuchembeds)
        merda.on('finish', () =>{
            fila[con.channel.guild.id].shift();
            if(!fila[con.channel.guild.id][0]) return con.disconnect() 
            tocar(con, fila[con.channel.guild.id][0], ch)
        })
    }
    } catch(e){
        ch.send(new MessageEmbed().setTitle('padero monkey').setDescription(`Error:\n\n\`\`\`${e}\`\`\`\n\n(if its error 410 reinstall ytdl)`).setColor(`#ff0000`))
    }
}

client.on('message', async message => {
    if(message.author.bot) return;
    if(!message.content.startsWith(prefixo)) return;
    const args = message.content.slice(prefixo.length).trim().split(/ +/g);
    const comando = args.shift().toLowerCase();
    const conn = message.guild.me.voice.connection
    const serverqueue = fila[message.guild.id]
    try{
    switch(comando){
        case 'play':
            if(!args[0]) return;
            const coisalegal = message.member.voice.channel
            if(!coisalegal) return message.channel.send('join a voice chat first dumbass')
            const porro = await coisalegal.join()
            tocar(porro, args.slice(0).join(` `), message.channel, message.author.id)
        break;
        case 'skip':
            if(!fila[conn.channel.guild.id]) return console.log(1);
            if(!conn.dispatcher) return console.log(2);
            if(!message.member.voice.channel) return console.log(3);
            if(message.member.voice.channel !== conn.channel) return message.channel.send("no")
            fila[conn.channel.guild.id].shift()
            conn.dispatcher.destroy()
            if(!serverqueue[0]) return conn.disconnect()
            tocar(message.guild.me.voice.connection, fila[conn.channel.guild.id][0], message.channel, message.author.id, true)
        break;
        case 'help':
            const ajuda = ["!!play <search keywords>/video or playlist url> - plays stuff (obv retard)",
            "!!skip - skips the current music",
            "!!queue - shows the server queue",
            "!!info - shows current music, current track position and volume",
            "!!volume <0-100 or even more> - changes volume so your ears get confortable",
            "!!monke - monke"]
            const punheta = new MessageEmbed()
            .setTitle('help')
            .setDescription('shit music bot by padero - prefixo: !!\n\n'+ajuda.join(`\n`))
            .setColor(`#18ebf2`)
            message.channel.send(punheta)
        break;
        case 'queue':
            let filaa = new MessageEmbed().setColor(`#18ebf2`)
            if(!message.member.voice.channel) return;
            var coisa = new Array()
            if(serverqueue.length > 20){
                filaa.setTitle(`server queue - ${serverqueue.length} items (showing only 20 because its too big)`)
                for(let a = 0; a < 20; a++) coisa.push(`${Number(a)+1} - [${serverqueue[a][1]}](${serverqueue[a][0]})`)
            } else {
                for(const a in serverqueue) coisa.push(`${Number(a)+1} - [${serverqueue[a][1]}](${serverqueue[a][0]})`)
                filaa.setTitle(`server queue - ${serverqueue.length} items`)
            }
            filaa.setDescription(coisa.join(`\n`))
            message.channel.send(filaa)
        break;
        case 'info':
            if(!serverqueue) return;
            if(!conn) return;
            if(!conn.dispatcher) return;
            let tempo = "=========="
            tempo = tempo.split('')
            tempo[Math.round((conn.dispatcher.streamTime/serverqueue[0][2])*10)] = '๏'
            tempo = tempo.join('') //transforma em array pq n tem uma função nativa que muda um caractere em certo índex
            tempo = tempo.split('๏')
            tempo[0] = `[${tempo[0]}](https://www.youtube.com/watch?v=Yq0zBXN1o2A)`
            tempo = tempo.join('๏')
            tempo = "**" + tempo + "**"
            const informação = [`[${serverqueue[0][1]}](${serverqueue[0][0]})`,
            `Volume: ${Number(conn.dispatcher.volume)*100}`,
            `${convert(conn.dispatcher.streamTime)} - ${convert(serverqueue[0][2])}`,
            tempo
            ]
            const infoo = new MessageEmbed()
            .setTitle('current music info')
            .setColor(`#18ebf2`)
            .setDescription(informação.join(`\n`))
            message.channel.send(infoo)
        break;
        case 'volume':
            if(!conn.dispatcher || !args[0]) return;
            if(isNaN(args[0])) return;
            if(!message.member.voice.channel) return;
            conn.dispatcher.setVolume(Number(args[0])/100)
            message.channel.send(`Current volume: ${args[0]}`)
        break;
        case 'monke':
            message.channel.send(new MessageEmbed().setColor(`#18ebf2`).setImage(`https://c.tenor.com/p9A-qL72haUAAAAC/monkey-spin-monkey.gif`))
        break;
        case "skipall":
            if(message.author.id !== '828056235001118741') return message.channel.send('fuck you')
            fila[message.guild.id] = []
            conn.disconnect()
        break;
    }
    }catch(e){
        message.channel.send(new MessageEmbed().setTitle('padero monke').setDescription(`Error:\n\n\`\`\`${e}\`\`\``).setColor(`#ff0000`))
    }
})

client.on('voiceStateUpdate', (veio, novo) =>{ //coisa o treco de sair quando tem mais ngm no canal
    if(!veio.channel) return
    if(fila[veio.channel.guild.id]){
        if(veio.channel.members.filter((m) => !m.user.bot).size == 0){
            if(veio.member.user == client.user) return;
            const con = veio.channel.guild.me.voice.connection
            con.channel.leave()
            fila[con.channel.guild.id] = []
        }
    }
})

client.login(process.env.token)
