/** searchResults
 * Searches for anime/shows/movies based on a keyword.
 * @param {string} keyword - The search keyword.
 * @returns {Promise<string>} - A JSON string of search results.
 */
async function searchResults(keyword) {
    try {

        // ✅ Nothing to change here
        const encodedKeyword = encodeURIComponent(keyword);

        // 🔧 CHANGE THIS URL TO YOUR ACTUAL SEARCH API
        // Replace: https://api.your-source.com/search
        const responseText = await soraFetch(`https://anime.uniquestream.net/api/v1/search?page=1&query=${encodedKeyword}&language=dub`);

        const data = JSON.parse(responseText);

        // (Optional) You may remove or modify this filter depending on API structure
        const filteredAnimes = data.data.animes.filter(anime => anime.episodes.dub !== null); 
        
        const transformedResults = data.data.animes.map(anime => ({

            // 🔧 Make sure "name" is the correct title field from your API
            title: anime.name,

            // 🔧 Make sure "poster" is the correct image field
            image: anime.poster,

            // 🔧 CHANGE THIS DOMAIN to your actual watch page
            href: `https://anime.uniquestream.net/watch/${anime.content_id}`
        }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Fetch error:', error);
        return JSON.stringify([{ title: 'Error', image: '', href: '' }]);
    }
}




/** extractDetails
 * Extracts details of an anime from its page URL.
 * @param {string} url - The URL of the anime page.
 * @returns {Promise<string>} - A JSON string of the anime details.
 */
async function extractDetails(url) {
    try {

        // 🔧 CHANGE THIS DOMAIN to match your website
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);

        const encodedID = match[1];

        // 🔧 CHANGE THIS URL to your actual anime info API endpoint
        const response = await soraFetch(`https://anime.uniquestream.net/api/v1/content/${encodedID}`);

        const data = JSON.parse(response);
        
        // 🔧 Make sure these fields exist in your API response:
        // data.data.anime.info
        // data.data.anime.moreInfo
        const animeInfo = data.data.anime.info;
        const moreInfo = data.data.anime.moreInfo;

        const transformedResults = [{
            // 🔧 Ensure description exists in your API
            description: animeInfo.description || 'No description available',

            // 🔧 Ensure this "duration" path matches your API structure
            aliases: `Duration: ${animeInfo.stats?.duration || 'Unknown'}`,

            // 🔧 Make sure "aired" is the correct field from API
            airdate: `Aired: ${moreInfo?.aired || 'Unknown'}`
        }];
        
        return JSON.stringify(transformedResults);

    } catch (error) {
        console.log('Details error:', error);
        return JSON.stringify([{
        description: 'Error loading description',
        aliases: 'Duration: Unknown',
        airdate: 'Aired: Unknown'
        }]);
  }
}




/** extractEpisodes
 * Extracts episodes of an anime from its page URL.
 * @param {string} url - The URL of the anime page.
 * @returns {Promise<string>} - A JSON string of the anime episodes.
 */
async function extractEpisodes(url) {
    try {

        // 🔧 CHANGE THIS DOMAIN to your own site
        const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);

        const encodedID = match[1];

        // 🔧 CHANGE THIS URL to your episodes API endpoint
        const response = await soraFetch(`https://anime.uniquestream.net/api/v1/season/${encodedID}/episodes`);

        const data = JSON.parse(response);


        const transformedResults = data.data.episodes.map(episode => ({

            // 🔧 Your API must return "episodeId". If it's different, update here.
            href: `https://anime.uniquestream.net/watch/${encodedID}?ep=${episode.episode_number}`,


            // 🔧 Make sure "number" exists in your API
            number: episode.number
        }));
        
        return JSON.stringify(transformedResults);
        
    } catch (error) {
        console.log('Fetch error:', error);
    }    
}




/** extractStreamUrl
 * Extracts the stream URL of an anime episode from its page URL.
 * @param {string} url - The URL of the anime episode page.
 * @returns {Promise<string|null>} - The stream URL or null if not found.
 */
async function extractStreamUrl(url) {
    try {

       // 🔧 CHANGE DOMAIN TO YOUR SITE
       const match = url.match(/https:\/\/anime\.uniquestream\.net\/watch\/(.+)$/);

       const encodedID = match[1];

       // 🔧 CHANGE THIS URL to your actual "episode sources" API
       const response = await soraFetch(`https://anime.uniquestream.net/api/v1/episode/${episodeID}/media/dash/en-US`);

       const data = JSON.parse(response);
       
       // 🔧 Make sure your API includes: data.data.sources
       const hlsSource = data.data.sources.find(source => source.type === 'hls');
       
       return hlsSource ? hlsSource.url : null;

    } catch (error) {
       console.log('Fetch error:', error);
       return null;
    }
}




/** soraFetch
 * Fetch function that tries a custom fetch implementation first,
 * and falls back to the native fetch if it fails.
 */
async function soraFetch(url, options = { headers: {}, method: 'GET', body: null }) {
    try {

        // 🔧 If you are NOT using fetchv2, you can DELETE this try block
        return await fetchv2(url, options.headers ?? {}, options.method ?? 'GET', options.body ?? null);

    } catch(e) {
        try {
            // 🔧 If using Node.js, make sure "fetch" exists (Node 18+)
            return await fetch(url, options);

        } catch(error) {
            await console.log('soraFetch error: ' + error.message);
            return null;
        }
    }
}
