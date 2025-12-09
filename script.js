/** searchResults
 * Searches for dubbed anime only.
 */
async function searchResults(keyword) {
    try {
        const encodedKeyword = encodeURIComponent(keyword);
        const responseText = await soraFetch(`https://anime.uniquestream.net/api/v1/search?page=1&query=${encodedKeyword}&language=dub`);
        if (!responseText) return JSON.stringify([]);

        const data = JSON.parse(responseText);

        const filteredAnimes = (data.series || []).filter(anime => anime.dubbed);

        const transformedResults = filteredAnimes.map(anime => ({
            title: anime.title || anime.name,
            image: anime.image || anime.poster,
            href: `https://anime.uniquestream.net/watch/${anime.content_id}`
        }));

        return JSON.stringify(transformedResults);

    } catch (error) {
        console.log('Search error:', error);
        return JSON.stringify([]);
    }
}

/** extractDetails */
async function extractDetails(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);
        if (!match) return JSON.stringify([{ description: 'Invalid URL', aliases: '', airdate: '' }]);

        const contentId = match[1];
        const responseText = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${contentId}`);
        if (!responseText) return JSON.stringify([{ description: 'No data', aliases: '', airdate: '' }]);

        const data = JSON.parse(responseText);
        const info = data.anime?.info || {};

        return JSON.stringify([{
            description: info.description || 'No description available',
            aliases: `Duration: ${info.type === 'TV' ? '24 min' : 'Unknown'}`,
            airdate: `Aired: ${info.released || 'Unknown'}`
        }]);

    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{ description: 'Error loading details', aliases: '', airdate: '' }]);
    }
}

/** extractEpisodes */
async function extractEpisodes(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);
        if (!match) return JSON.stringify([]);

        const contentId = match[1];

        const responseText = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${contentId}`);
        if (!responseText) return JSON.stringify([]);

        const data = JSON.parse(responseText);
        const episodes = data.anime?.episodes?.dub || [];

        const transformedResults = episodes.map(episode => ({
            href: `https://anime.uniquestream.net/watch/${contentId}?ep=${episode.episode_number}`,
            number: episode.number || episode.episode_number
        }));

        return JSON.stringify(transformedResults);

    } catch (error) {
        console.log('Episodes error:', error);
        return JSON.stringify([]);
    }
}

/** extractStreamUrl */
async function extractStreamUrl(url) {
    try {
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+?)\?ep=(\d+)$/);
        if (!match) return null;

        const contentId = match[1];
        const episodeNum = match[2];

        const responseText = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${contentId}/episode/${episodeNum}/sources`);
        if (!responseText) return null;

        const data = JSON.parse(responseText);
        const hlsSource = (data.data?.sources || []).find(s => s.type === 'hls');

        return hlsSource ? hlsSource.url : null;

    } catch (error) {
        console.log('Stream error:', error);
        return null;
    }
}

/** soraFetch
 * Fetch function that tries a custom fetch implementation first,
 * and falls back to the native fetch if it fails.
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {

        // If you are NOT using fetchv2, you can DELETE this try block
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);

    } catch(e) {
        try {
            // If using Node.js, make sure "fetch" exists (Node 18+)
            return await fetch(url, options);

        } catch(error) {
            await console.log('soraFetch error: ' + error.message);
            return null;
        }
    }
}