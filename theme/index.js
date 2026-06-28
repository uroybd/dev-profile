const lucide = require("lucide");
const simpleIcons = require("simple-icons");
const fs = require("fs");
const path = require("path");
const markdownIt = require("markdown-it");
const md = new markdownIt({ html: true });
const mdBlock = (str) => (str ? md.render(String(str)) : "");
const mdInline = (str) => (str ? md.renderInline(String(str)) : "");

function lucideIcon(name) {
  const key = name
    .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    .replace(/^([a-z])/, (_, c) => c.toUpperCase());
  const icon = lucide.icons[key];
  if (!icon) return "";
  const children = icon
    .map(
      ([tag, attrs]) =>
        `<${tag} ${Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ")}/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle">${children}</svg>`;
}

function brandIcon(slug) {
  const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
  const icon = simpleIcons[key];
  if (icon)
    return icon.svg.replace(
      "<svg ",
      `<svg width="16" height="16" fill="black" style="vertical-align:middle" `,
    );
  const localPath = path.join(__dirname, "../src/icons", `${slug}.svg`);
  if (fs.existsSync(localPath))
    return fs
      .readFileSync(localPath, "utf8")
      .trim()
      .replace(
        "<svg ",
        `<svg width="16" height="16" fill="black" style="vertical-align:middle" `,
      );
  return "";
}

const networkIconMap = {
  github: () => brandIcon("github"),
  linkedin: () => brandIcon("linkedin"),
  twitter: () => brandIcon("x"),
  x: () => brandIcon("x"),
};

function networkIcon(network) {
  const fn = networkIconMap[network.toLowerCase()];
  return fn ? fn() : brandIcon(network.toLowerCase());
}

function date(str) {
  if (!str) return "Present";
  return str.slice(0, 7);
}

function pills(keywords) {
  if (!keywords || !keywords.length) return "";
  return `<div class="keywords">${keywords.map((k) => `<span class="pill">${k}</span>`).join("")}</div>`;
}

function render(resume) {
  const {
    basics = {},
    skills = [],
    work = [],
    volunteer = [],
    projects = [],
    languages = [],
    interests = [],
    references = [],
  } = resume;

  const profiles = (basics.profiles || [])
    .map((p) => {
      const label = p.username || p.url;
      return `<span class="info-item">${networkIcon(p.network)} ${p.url ? `<a href="${p.url}">${label}</a>` : label}</span>`;
    })
    .join("");

  const contactItems = [
    basics.email
      ? `<span class="info-item">${lucideIcon("mail")} <a href="mailto:${basics.email}">${basics.email}</a></span>`
      : "",
    basics.phone
      ? `<span class="info-item">${lucideIcon("phone")} ${basics.phone}</span>`
      : "",
    basics.location && basics.location.city
      ? `<span class="info-item">${lucideIcon("map-pin")} ${basics.location.city}${basics.location.countryCode ? ", " + basics.location.countryCode : ""}</span>`
      : "",
    basics.website
      ? `<span class="info-item">${lucideIcon("link")} <a href="${basics.website}">${basics.website}</a></span>`
      : "",
    profiles,
  ]
    .filter(Boolean)
    .join("");

  const skillsHtml = skills
    .map(
      (s) => `
    <div class="col-item">
      <h4>${s.name}</h4>
      ${s.level ? `<div class="sub">${s.level}</div>` : ""}
      ${pills(s.keywords)}
    </div>`,
    )
    .join("");

  const workHtml = work
    .map(
      (j) => `
    <div class="col-item">
      <div class="item-header">
        <div class="title-container">
          <div class="title-with-url">
            <h4>${j.website ? `<a href="${j.website}">${j.name}</a>` : j.name}</h4>
            ${j.website ? `<a class="item-url" href="${j.website}">${j.website}</a>` : ""}
          </div>
          <div class="sub">${j.position}</div>
        </div>
        <div class="meta">
          ${j.location ? `<span>${j.location}</span>` : ""}
          <span>${date(j.startDate)} – ${date(j.endDate)}</span>
        </div>
      </div>
      ${j.summary ? mdBlock(j.summary) : ""}
      ${j.highlights && j.highlights.length ? `<ul>${j.highlights.map((h) => `<li>${mdInline(h)}</li>`).join("")}</ul>` : ""}
    </div>`,
    )
    .join("");

  const volunteerHtml = volunteer
    .map(
      (v) => `
    <div class="col-item">
      <div class="item-header">
        <div class="title-container">
          <div class="title-with-url">
            <h4>${v.url ? `<a href="${v.url}">${v.organization}</a>` : v.organization}</h4>
            ${v.url ? `<a class="item-url" href="${v.url}">${v.url}</a>` : ""}
          </div>
          <div class="sub">${v.position}</div>
        </div>
        ${v.startDate || v.endDate ? `<div class="meta"><span>${date(v.startDate)} – ${date(v.endDate)}</span></div>` : ""}
      </div>
      ${v.summary ? mdBlock(v.summary) : ""}
      ${v.highlights && v.highlights.length ? `<ul>${v.highlights.map((h) => `<li>${mdInline(h)}</li>`).join("")}</ul>` : ""}
    </div>`,
    )
    .join("");

  const projectsHtml = projects
    .map(
      (p) => `
    <div class="col-item">
      <div class="item-header">
        <div class="title-with-url">
          <h4>${p.url || p.website ? `<a href="${p.url || p.website}">${p.name}</a>` : p.name}</h4>
          ${p.url || p.website ? `<a class="item-url" href="${p.url || p.website}">${p.url || p.website}</a>` : ""}
        </div>
        ${p.startDate || p.endDate ? `<span class="meta">${date(p.startDate)}${p.endDate ? " – " + date(p.endDate) : ""}</span>` : ""}
      </div>
      ${p.description ? mdBlock(p.description) : ""}
      ${p.highlights && p.highlights.length ? `<ul>${p.highlights.map((h) => `<li>${mdInline(h)}</li>`).join("")}</ul>` : ""}
    </div>`,
    )
    .join("");

  const languagesHtml = languages
    .map(
      (l) => `
    <div class="lang-item">
      <span class="lang-name">${l.language}</span>
      ${l.fluency ? `<span class="sub">${l.fluency}</span>` : ""}
    </div>`,
    )
    .join("");

  const interestsHtml = interests
    .map(
      (i) => `
    <div class="interest-item">
      <span class="lang-name">${i.name}</span>
      ${pills(i.keywords)}
    </div>`,
    )
    .join("");

  const referencesHtml = references
    .map(
      (r) => `
    <figure class="reference-item">
      <blockquote class="reference-quote">${mdBlock(r.reference)}</blockquote>
      <figcaption class="reference-name">— ${r.name ? r.name.split("\n").map((line) => mdInline(line)).join("<br>") : ""}</figcaption>
    </figure>`,
    )
    .join("");

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --bg: #e8e3df;
      --text: #000;
      --accent: #303030;
    }

    html { font-size: 12px; }

    body {
      font-family: Lato, sans-serif;
      color: var(--text);
      margin: 0;
      padding: 0;
      font-weight: 300;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 300;
      margin-top: 0;
      margin-bottom: 0.5rem;
    }

    h1 { font-size: 2.8rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.2rem; }
    h4 { font-size: 1rem; margin-bottom: 0.2rem; }

    a { color: var(--accent); text-decoration: none; }

    p, li { font-weight: 300; line-height: 1.5; }

    header {
      display: flex;
      align-items: center;
      padding: 0.75rem 0 1.5rem;
      gap: 1.5rem;
    }

    header img {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 3px solid var(--accent);
      object-fit: cover;
    }

    .section {
      padding: 0 0 1.25rem;
    }

    .section hr {
      border: none;
      border-top: 1px solid var(--accent);
      margin-bottom: 1rem;
    }

    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem 1.5rem;
      padding: 0 0 1.25rem;
      font-size: 0.9rem;
    }

    .info-item svg {
      margin-right: 0.3rem;
    }

    #summary {
      font-size: 0.95rem;
      line-height: 1.6;
      text-align: justify;
    }

    .two-col {
      columns: 2;
      gap: 2rem;
    }

    .col-item {
      margin-bottom: 1.25rem;
    }

    .col-item h4, .section h3, .section hr {
      break-after: avoid;
      page-break-after: avoid;
      -webkit-column-break-after: avoid;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .title-container {
      flex: 1;
    }

    .title-with-url {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 1rem;
      margin-bottom: 0.25rem;
    }

    .title-with-url h4 {
      flex-shrink: 0;
      margin-bottom: 0;
    }

    .sub {
      font-size: 0.9rem;
      color: var(--accent);
      font-weight: 300;
    }

    .meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      font-size: 0.85rem;
      color: var(--accent);
      white-space: nowrap;
    }

    ul {
      padding-left: 1.25rem;
      margin: 0.5rem 0 0;
    }

    .keywords {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .pill {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      border: 1px solid var(--accent);
      font-size: 0.78rem;
      font-weight: 300;
    }

    .lang-list, .interest-list {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem 3rem;
    }

    .lang-item, .interest-item {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }

    .lang-name {
      font-size: 1rem;
      font-weight: 400;
    }

    .item-url {
      font-size: 0.78rem;
      color: var(--accent);
      opacity: 0.7;
      text-align: right;
      word-break: break-all;
    }

    .reference-item {
      margin: 0 0 1rem;
      padding: 0.9rem 1.25rem;
      border-left: 3px solid var(--accent);
      background: rgba(0, 0, 0, 0.03);
      break-inside: avoid;
      page-break-inside: avoid;
    }

    .reference-quote {
      margin: 0 0 0.5rem;
    }

    .reference-quote p {
      margin: 0;
      line-height: 1.6;
      font-style: italic;
      font-weight: 300;
    }

    .reference-name {
      font-size: 0.85rem;
      color: var(--accent);
      font-weight: 400;
      text-align: right;
      display: block;
    }

  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${basics.name || "Resume"}</title>
  <style>${css}</style>
</head>
<body>
  <header>
    ${basics.image ? `<img src="${basics.image}" alt="${basics.name}">` : ""}
    <div>
      <h1>${basics.name || ""}</h1>
      <h2>${basics.label || ""}</h2>
    </div>
  </header>

  ${contactItems ? `<div class="contact">${contactItems}</div>` : ""}

  ${basics.summary ? `<div class="section" id="summary">${mdBlock(basics.summary)}</div>` : ""}

  ${
    skills.length
      ? `
  <div class="section" id="section-skills">
    <h3>Skills</h3><hr>
    <div class="two-col">${skillsHtml}</div>
  </div>`
      : ""
  }

  ${
    work.length
      ? `
  <div class="section" id="section-work">
    <h3>Work</h3><hr>
    ${workHtml}
  </div>`
      : ""
  }

  ${
    projects.length
      ? `
  <div class="section" id="section-projects">
    <h3>Projects</h3><hr>
    ${projectsHtml}
  </div>`
      : ""
  }

  ${
    volunteer.length
      ? `
  <div class="section" id="section-volunteer">
    <h3>Open Source Contributions</h3><hr>
    ${volunteerHtml}
  </div>`
      : ""
  }

  ${
    languages.length || interests.length
      ? `
  <div id="section-misc" style="display:flex;gap:2rem;align-items:flex-start;">
    ${
      languages.length
        ? `
    <div class="section" style="flex:1;">
      <h3>Languages</h3><hr>
      <div class="lang-list">${languagesHtml}</div>
    </div>`
        : ""
    }
    ${
      interests.length
        ? `
    <div class="section" style="flex:1;">
      <h3>Interests</h3><hr>
      <div class="interest-list">${interestsHtml}</div>
    </div>`
        : ""
    }
  </div>`
      : ""
  }

  ${
    references.length
      ? `
  <div class="section" id="section-references">
    <h3>References</h3><hr>
    ${referencesHtml}
  </div>`
      : ""
  }

</body>
</html>`;
}

const pdfRenderOptions = {
  margin: { top: "1.5cm", right: "2cm", bottom: "1.8cm", left: "2cm" },
  outline: true,
  mediaType: "print",
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate: `<div style="width:100%;text-align:center;font-size:9px;color:#888;font-family:Lato,sans-serif;padding-bottom:4px;">
    <span class="pageNumber"></span> / <span class="totalPages"></span>
  </div>`,
};

module.exports = { render, pdfRenderOptions };
