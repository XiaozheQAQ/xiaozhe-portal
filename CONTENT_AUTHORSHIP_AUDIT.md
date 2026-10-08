# Content authorship audit

This project should read like a real person maintaining a technical space over time. The Agent can help with structure and editing, but it must not invent the author behind the site.

## Must be written by the author

- About: identity, current focus, motivation, interests, learning, and future direction.
- Project stories: why FastMusic, UniMC, Teleport, and Personal Portal exist.
- Project status, milestones, results, users, incidents, and lessons learned unless supported by project evidence.
- Lab history: what was actually tried, what failed, what was observed, and what happens next.
- First-person opinions, technical trade-offs, and personal reactions in blog posts.
- Future plans and any statement about personal ability, experience, or achievements.
- A real GitHub profile and email address, if they should be public.

## Agent can assist

- Markdown structure, frontmatter, headings, and formatting.
- Organizing the author's answers into a readable page or article.
- Technical fact checking against the repository and existing implementation.
- SEO descriptions that stay inside the supplied facts.
- Code formatting, examples, and content normalization.
- Copy editing and natural Chinese/English UI translation.
- Identifying unsupported claims and turning them into questions or TODOs.

## Agent must not invent

- Work or study history.
- Project history, achievements, user counts, adoption, or production results.
- Technical ability or experience level.
- Learning history or personal motivation.
- Feelings, life stories, failures, or future commitments.
- Contact details, social profiles, domains, or email addresses.

## Current content review

### Blog

`src/content/blog/why-personal-portal.md` is based on the author's supplied material. Its first-person judgments should remain source material. The Agent may tighten wording, but should not add new experiences or turn opinions about Astro, Next.js, SvelteKit, Serverless, or Edge into universal technical claims.

### Projects

| Project | Agent can confirm | Author must provide |
| --- | --- | --- |
| FastMusic | Name and repository-declared technology labels | Why it started, current status, interesting problems, and future plans |
| UniMC | Name and listed Minecraft/infrastructure technologies | Maintenance history, motivation, incidents, and what should be remembered |
| Teleport | Name and listed networking/Linux/Web direction | The problem it is meant to solve, actual progress, and next step |
| Personal Portal | Current content architecture and implementation | Personal motivation beyond the supplied blog material and future scope |

### Lab

The existing Lab files distinguish plans from completed work in places, but each experiment still needs author-supplied observations before it can be presented as a finished account:

- ESP32 Network Monitor: hardware actually used, completed checks, measurements, failures, and next step.
- AI Agent Playground: which experiments were actually run and what they showed.
- Network Experiments: concrete commands, environments, observations, and conclusions.

## Contact and metadata

The author confirmed the public GitHub profile as `https://github.com/XiaozheQAQ` and it is now used in the Footer, About page, and mobile navigation. No public email address has been confirmed, so no email link was added. No JSON-LD author metadata currently exists, so no unverified metadata was added.
