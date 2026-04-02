import { invokeApiProxy } from "@/lib/apiProxy";

export type Video = {
  id: string;
  nome: string;
  url: string;
  thumb: string;
  descricao: string;
};

export async function getPlaylistVideos(playlistId: string): Promise<Video[]> {
  const videos: Video[] = [];
  let nextPageToken: string | null | undefined = null;

  do {
    const { data, error } = await invokeApiProxy<{
      videos?: Video[];
      nextPageToken?: string | null;
      error?: string;
    }>("youtube_playlist", {
      playlistId,
      ...(nextPageToken ? { pageToken: nextPageToken } : {}),
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.videos?.length) break;

    videos.push(...data.videos);
    nextPageToken = data.nextPageToken ?? null;
  } while (nextPageToken);

  return videos;
}
