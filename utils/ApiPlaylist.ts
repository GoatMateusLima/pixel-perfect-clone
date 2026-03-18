const API_KEY = 'AIzaSyB8j7ruBLTJh-uCXy_onELV9HxwAGY6Nxg'
const PLAYLIST_ID = ''

async function getPlaylistVideos(playlistId: string) {
  const videos = []
  let nextPageToken = ''

  do {
    const params = new URLSearchParams({
      part: 'snippet',
      maxResults: '50',
      playlistId,
      key: API_KEY,
      ...(nextPageToken && { pageToken: nextPageToken }),
    })

    const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`)
    const data = await res.json()

    if (data.error) throw new Error(data.error.message)

    for (const item of data.items) {
      const videoId = item.snippet.resourceId.videoId
      videos.push({
        id: videoId,
        name: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      })
    }

    nextPageToken = data.nextPageToken ?? ''
  } while (nextPageToken)

  return videos
}

// uso
const videos = await getPlaylistVideos(PLAYLIST_ID)
console.log(videos)




import supabase from '../utils/supabase'

interface  aulas {

}



const videoid = 
const kind = 