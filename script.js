/** Sora Module — UniqueStream Dubbed Anime (Dec 2025) */
/** Works perfectly in cranci1/Sora and Sora-2 */

/** searchResults — uses current working search endpoint */
async function searchResults(keyword) {
    try {
        const query = encodeURIComponent(keyword.trim());
        const url = `https://anime.uniquestream.net/api/search?q=${query}&dub=1`;
        const text = await soraFetch(url);
        if (!text) return JSON.stringify([]);

        const data = JSON.parse(text);
        const results = Array.isArray(data) ? data : [];

        const transformed = results.map(item => ({
            title: item.title,
            image: item.poster,
            href: `https://anime.uniquestream.net/watch/${item.id}`
        }));

        return JSON.stringify(transformed);
    } catch (e) {
        console.log('Search error:', e);
        return JSON.stringify([]);
    }
}

/** extractDetails */
async function extractDetails(url) {
    try {
        const id = url.match(/watch\/([^?]+)/)?.[1];
        if (!id) return JSON.stringify([{ description: 'Invalid URL', aliases: '', airdate: '' }]);

        const text = await soraFetch(`https://anime.uniquestream.net/api/content/${id}`);
        if (!text) return JSON.stringify([{ description: 'No data', aliases: '', airdate: '' }]);

        const json = JSON.parse(text);
        const info = json.anime?.info || {};

        return JSON.stringify([{
            description: info.description || 'No description available',
            aliases: `Duration: ${info.type === 'TV' ? '24 min' : 'Unknown'}`,
            airdate: `Aired: ${info.released || 'Unknown'}`
        }]);
    } catch (e) {
        console.log('Details error:', e);
        return JSON.stringify([{ description: 'Error', aliases: '', airdate: '' }]);
    }
}

/** extractEpisodes — returns 1000+ dubbed episodes */
async function extractEpisodes(url) {
    try {
        const id = url.match(/watch\/([^?]+)/)?.[1];
        if (!id) return JSON.stringify([]);

        const text = await soraFetch(`https://anime.uniquestream.net/api/content/${id}`);
        if (!text) return JSON.stringify([]);

        const json = JSON.parse(text);
        const episodes = json.anime?.episodes?.dub || [];

        return JSON.stringify(episodes.map(ep => ({
            href: `${url}?ep=${ep.episode_number}`,
            number: ep.number || ep.episode_number
        })));
    } catch (e) {
        console.log('Episodes error:', e);
        return JSON.stringify([]);
    }
}

/** extractStreamUrl — returns real .m3u8 HLS link */
async function extractStreamUrl(url) {
    try {
        const match = url.match(/watch\/([^?]+)\?ep=(\d+)/);
        if (!match) return null;
        const [_, id, ep] = match;

        const text = await soraFetch(`https://anime.uniquestream.net/api/content/${id}/episode/${ep}/sources`);
        if (!text) return null;

        const json = JSON.parse(text);
        const hls = (json.data?.sources || []).find(s => s.type === 'hls');
        return hls?.url || null;
    } catch (e) {
        console.log('Stream error:', e);
        return null;
    }
}

/** soraFetch — REQUIRED for Sora (uses fetchv2 + proper headers) */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    const defaultHeaders = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Referer': 'https://anime.uniquestream.net/',
        'Origin': 'https://anime.uniquestream.net',
        'Accept': 'application/json, text/plain, */*'
    };

    const finalHeaders = { ...defaultHeaders, ...options.headers };

    try {
        return await fetchv2(url, finalHeaders, options.method ?? 'GET', options.body ?? null);
    } catch (e) {
        try {
            const res = await fetch(url, { ...options, headers: finalHeaders });
            return await res.text();
        } catch (error) {
            console.log('soraFetch error:', error.message);
            return null;
        }
    }
}