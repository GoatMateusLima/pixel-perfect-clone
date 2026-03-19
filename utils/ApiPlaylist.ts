const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY

export type Video = {
  id: string
  nome: string
  url: string
  thumb: string
  descricao: string
}

export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  const videos: Video[] = []
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
        nome: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumb: item.snippet.thumbnails?.medium?.url ?? '',
        descricao: item.snippet.description ?? '',
      })
    }

    nextPageToken = data.nextPageToken ?? ''
  } while (nextPageToken)

  return videos
}