const yaml = require("js-yaml");
const sass = require("sass");
const lucide = require("lucide");
const simpleIcons = require("simple-icons");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const markdownIt = require("markdown-it");
const md = new markdownIt({ html: true });

function iconToSvg(name, attrs = {}) {
  const iconName = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()).replace(/^([a-z])/, (_, c) => c.toUpperCase());
  const icon = lucide.icons[iconName];
  if (!icon) throw new Error(`Lucide icon not found: "${name}" (resolved to "${iconName}")`);

  const defaultAttrs = { xmlns: "http://www.w3.org/2000/svg", width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" };
  const merged = { ...defaultAttrs, ...attrs };
  const svgAttrs = Object.entries(merged).map(([k, v]) => `${k}="${v}"`).join(" ");
  const children = icon.map(([tag, childAttrs]) => {
    const ca = Object.entries(childAttrs).map(([k, v]) => `${k}="${v}"`).join(" ");
    return `<${tag} ${ca}/>`;
  }).join("");
  return `<svg ${svgAttrs}>${children}</svg>`;
}

module.exports = function (eleventyConfig) {
  const _now = new Date();
  const buildDate = _now.toISOString().slice(0, 16).replace("T", "-").replace(":", "-");
  const resumeName = yaml.load(fs.readFileSync("src/_data/resume.yaml", "utf8")).basics.name.replace(/\s+/g, "_");
  const cvFilename = `cv-${resumeName}-${buildDate}`;
  eleventyConfig.addGlobalData("cvFilename", cvFilename);
  eleventyConfig.addFilter("md", (content) => content ? md.render(String(content)) : "");
  eleventyConfig.addFilter("mdInline", (content) => content ? md.renderInline(String(content)) : "");

  eleventyConfig.addShortcode("jsonLd", (resume) => {
    const { basics = {}, work = [], skills = [] } = resume;
    const currentJob = work.find(j => !j.endDate);
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      name: basics.name,
      jobTitle: basics.label,
      url: basics.website,
      email: basics.email,
    };
    const profileUrls = (basics.profiles || []).map(p => p.url).filter(Boolean);
    if (profileUrls.length) person.sameAs = profileUrls;
    if (currentJob) {
      person.worksFor = { "@type": "Organization", name: currentJob.name };
      if (currentJob.website) person.worksFor.url = currentJob.website;
    }
    const knowsAbout = skills.flatMap(s => s.keywords || []);
    if (knowsAbout.length) person.knowsAbout = knowsAbout;
    if (basics.website) {
      person.mainEntityOfPage = { "@type": "ProfilePage", "@id": basics.website };
    }
    return `<script type="application/ld+json">\n${JSON.stringify(person, null, 2)}\n</script>`;
  });

  eleventyConfig.addShortcode("icon", (name, extraClass) => {
    const attrs = extraClass ? { class: extraClass } : {};
    return iconToSvg(name, attrs);
  });

  eleventyConfig.addShortcode("brandicon", (slug, extraClass) => {
    const key = "si" + slug.charAt(0).toUpperCase() + slug.slice(1);
    const icon = simpleIcons[key];
    const classAttr = extraClass ? ` class="${extraClass}"` : "";
    const svgStr = icon ? icon.svg : (() => {
      const localPath = path.join("src", "icons", `${slug}.svg`);
      if (!fs.existsSync(localPath)) throw new Error(`Brand icon not found: "${slug}" (checked simple-icons and ${localPath})`);
      return fs.readFileSync(localPath, "utf8").trim();
    })();
    return svgStr.replace("<svg ", `<svg fill="black" width="24" height="24"${classAttr} `);
  });
  eleventyConfig.on("afterBuild", () => {
    const resumeData = yaml.load(fs.readFileSync("src/_data/resume.yaml", "utf8"));
    if (resumeData.basics) delete resumeData.basics.image;
    const tmpJson = path.join(require("os").tmpdir(), "resume-build.json");
    fs.writeFileSync(tmpJson, JSON.stringify(resumeData));
    execSync(`./node_modules/.bin/resume export public/${cvFilename}.pdf --resume ${tmpJson} --theme ./theme`, { stdio: "inherit" });
    fs.copyFileSync(`public/${cvFilename}.pdf`, "public/cv.pdf");
  });

  eleventyConfig.addDataExtension("yaml, yml", (contents) => {
    return yaml.load(contents);
  });

  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/favicon.ico");
  eleventyConfig.addPassthroughCopy("src/apple-touch-icon.png");

  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    compile: async function (inputContent, inputPath) {
      if (inputPath.split("/").at(-1).startsWith("_")) return;
      return async () => {
        let result = sass.compile(inputPath);
        return result.css;
      };
    },
  });
  return {
    dir: {
      input: "src", // Now looks inside ./src/ for templates
      includes: "_includes", // Points to ./src/_includes/
      data: "_data", // Points to ./src/_data/
      output: "public", // Renames output folder from _site to public
    },
  };
};
