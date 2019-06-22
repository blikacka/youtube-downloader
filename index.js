const yas = require('youtube-audio-server')
const express = require('express')
const app = express()
const fs = require('fs')
const request = require('request')
const btoa = require('btoa')
const atob = require('atob')

let baseResponse = null

/**
 * Remove loader from page
 *
 * @param res
 * @return {*}
 */
const removeLoader = res => res.write("<script>document.getElementById('loader-image').remove()</script>")

/**
 * Download YT image
 *
 * @param uri
 * @param filename
 * @param callback
 */
const downloadImage = (uri, filename, callback) => {
    request.head(uri, () => {
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback)
    })
}

/**
 * Download audio from YT
 *
 * @param videoId
 * @param res
 */
const downloadAudio = (videoId, res) => {
    yas.setKey('AIzaSyBEymQ0gBUujFtiv4EUMubcjMWThAB2xsQ')

    yas.get(videoId, (videoErr, videoData) => {
        console.log('GOT METADATA for HQmmM_qwG4k:', JSON.stringify(videoData || videoErr))

        const nowTimestamp = Math.floor(Date.now() / 1000);
        const name = btoa(videoData.items.slice(0, 1)[0].snippet.title)
        const image = videoData.items.slice(0, 1)[0].snippet.thumbnails.medium.url

        const fileBase = `${nowTimestamp}-${videoId}-${name}`

        const file = `${fileBase}.mp3`
        const fileImage = `public/downloads/${fileBase}.jpg`

        downloadImage(image, fileImage, () => {
            console.log('obr done')
        })

        yas.downloader
            .onSuccess(({id, file}) => {
                const fileName = file.replace('public/', '')

                removeLoader(res)
                res.write('Staženo!<br />')
                res.write(`<a href='${fileName}'>${fileName}</a><br/>`)
                res.write(`<a href='/'>Zpět</a>`)
                res.end()
            })
            .onError(({id, file, error}) => {
                console.log('ERR', error)
                throw new Error(error)
            })
            .download({id: videoId, file: `public/downloads/${file}`})
    })
}

app.use(express.static('public'))

process.on('uncaughtException', err => {
    console.error(err)
    console.log("Node NOT Exiting...")

    if (baseResponse) {
        removeLoader(baseResponse)
        baseResponse.write('Nepovedlo se stáhnout soubor...' + JSON.stringify(err))
        baseResponse.write(`<br /><a href='/'>Zpět</a>`)
        baseResponse.end()
    }
})

app.get('/', (req, res) => {
    res.sendFile('index.html')
})

app.get('/items', (req, res) => {
    fs.readdir('public/downloads', (err, items) => {
        let data = {}

        items.reverse().forEach(item => {
            if (item.startsWith('.')) {
                return
            }

            const splitted = item.split('-')

            const timestamp = 'xx' + splitted.splice(0, 1)[0]
            const file = splitted.splice(-1)[0]
            const name = atob(file.split('.').splice(0, 1)[0])
            const ending = file.split('.').splice(-1)[0]

            if (!Array.isArray(data[timestamp])) {
                data[timestamp] = []
            }

            data[timestamp].push({
                time: timestamp.replace('xx', ''),
                file: item,
                name: name,
                ending: ending,
                size: ending === 'mp3' ? fs.statSync(`public/downloads/${item}`).size : null,
            })
        })

        res.send(JSON.stringify(data))

    })
})

app.get('/download', (req, res) => {
    baseResponse = res
    let videoId = req.query.video

    if (!videoId) {
        res.status(404)
        res.send('Chybí název videa!')
        return
    }

    videoId = videoId.split('/').slice(-1)[0]
    videoId = videoId.replace('watch?v=', '')

    console.log(videoId)

    res.setHeader("Content-Type", "text/html");
    res.write('<meta charset="UTF-8"><title>YouTube MP3</title>')

    try {
        res.write("<p id='loader-image'><img src='loader.gif' /> Načítání...</p>")

        downloadAudio(videoId, res)
    } catch (error) {
        removeLoader(res)
        res.write('Nepovedlo se stáhnout soubor...' + JSON.stringify(error))
        res.end()
    }
})


app.listen(8760)
