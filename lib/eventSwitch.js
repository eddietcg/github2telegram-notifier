// Webhook events switch
// https://docs.github.com/en/developers/webhooks-and-events/webhook-events-and-payloads

function cl(text) {
    if (!text) return ""
    return text.replace('_', '\\_').replace('*', '\\*').replace("[", "\\[").replace("]", "\\]")
}

module.exports.eventSwitch = async function (gh_event, body) {
    const action = cl(body.action)
    const repo = body.repository
    const repo_full_name = cl(repo.full_name)
    const repo_html_url = repo.html_url
    const sender = body.sender
    // const organization = cl(body.organization)
    const installation = cl(body.installation)
    const ref = (body.ref || "").replace(/refs\/heads\//, '')

    msg = `Type: *${cl(gh_event).toUpperCase()}*` + `\nFrom: [${repo_full_name}](${repo_html_url})\n\n`
    

    if (body.created || body.deleted) {
        return "";
    }

    switch (gh_event) {
        case 'create': {
            return msg + `[${cl(sender.login)}](${sender.html_url}) created ${body.ref_type}: [${ref}](${repo_html_url}/tree/${ref})`
        }

        case 'ping': {
            const zen = cl(body.zen)
            return msg + `Zen: ${zen}`
        }

        case 'star': {
            const at = body.starred_at
            done = (action === "created") ? "Starred" : "Un-Starred"

            return msg + `[${cl(sender.login)}](${sender.html_url}) ${done} at ${at}`
        }

        case 'push': {
            // const pusher = body.pusher
            const commits = body.commits
            const compare = body.compare

            commits_str = ""
            for (commit of commits) {
                const msg = cl(commit.message);
                commits_str = commits_str + `[${msg}](${commit.url})\n`
            }

            return msg + `[${cl(sender.login)}](${sender.html_url})` +
                ` pushed to [${ref}](${repo_html_url}/tree/${ref}) with ${commits.length} commits.\n` +
                `\n [Compare](${compare})` +
                `\n\n*Commits:*\n` +
                `${commits_str}`
        }

        case 'fork': {
            const forkee = body.forkee

            return msg + `[${cl(sender.login)}](${sender.html_url}) forked to [${cl(forkee.full_name)}](${forkee.html_url}) at ${forkee.created_at}`
        }

        case 'delete': {
            return msg + `[${cl(sender.login)}](${sender.html_url}) deleted branch: *${ref}*`
        }

        case 'repository': {
            return msg + `[${cl(sender.login)}](${sender.html_url}) ${action} [${repo_full_name}](${repo_html_url})`
        }
    }
};
