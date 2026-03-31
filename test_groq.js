const GROQ_API_KEY = oio;

(async () => {
    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: "oi" }],
                max_tokens: 10
            })
        });
        console.log("Status:", response.status);
        console.log(await response.text());
    } catch (e) {
        console.error(e);
    }
})();
