# CeFEM - Modern Astro Theme
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**CeFEM** is a high-performance, feature-rich theme for Astro JS, designed for modern websites, blogs, and portfolios. With beautiful UI components, multiple theme options, and a focus on performance, CeFEM helps you build stunning websites quickly.

[Live Demo](https://titan-core.netlify.app)

## ✨ Features

- 🎨 **Multiple Theme Options** - Choose from various color themes
- 📱 **Fully Responsive** - Looks great on all devices
- 🚀 **Performance Focused** - Optimized for speed and SEO
- 📝 **Blog Ready** - Complete blog functionality with categories and pagination
- 🔍 **SEO Optimized** - Meta tags, Open Graph, Twitter Cards, and sitemap
- 🧩 **Component-Based** - Modular architecture for easy customization
- 🎭 **Animation Ready** - Integrated AOS (Animate On Scroll) for smooth animations
- 📊 **Stats Section** - Display your metrics with beautiful stat components
- 🤝 **Team Grid** - Showcase your team members
- 🔄 **Flexible Layouts** - Hero sections, feature grids, split panels, and more
- 📋 **FAQ Component** - Easy-to-use FAQ accordion
- 📞 **Contact Components** - Ready-to-use contact information display
- 🏢 **Logo Showcase** - Display partner or client logos
- 🔘 **Modern UI Components** - Buttons, forms, cards, and more

## 🚀 Quick Start

```bash
# Create a new project with this theme
npm create astro@latest -- --template rspisarski/titan-core

# or clone this repository
git clone https://github.com/rspisarski/titan-core.git my-website
cd my-website
npm install
npm run dev
```

## 📁 Project Structure

```
/
├── public/             # Static assets
│   └── favicon.ico
├── src/
│   ├── assets/         # Images and other assets
│   ├── components/     # UI components
│   │   ├── blog/       # Blog-specific components
│   │   ├── forms/      # Form components
│   │   ├── icons/      # Icon components
│   │   ├── sections/   # Page section components
│   │   ├── team/       # Team components
│   │   └── ui/         # Basic UI components
│   ├── content/        # Content collections
│   ├── data/           # Configuration and data files
│   ├── layouts/        # Page layouts
│   ├── pages/          # Page routes
│   ├── styles/         # Global styles
│   └── utils/          # Utility functions
└── package.json
```

## ⚙️ Configuration

Customize your site by editing the configuration files in the `src/data/` directory:

- `config.ts` - Site-wide configuration including company info and SEO settings
- `menu.ts` - Navigation menu structure
- `features.ts` - Feature section content
- `faqs.ts` - FAQ content
- `logos.ts` - Partner/client logos
- `stats.ts` - Statistics display data
- `categories.ts` - Blog categories

## 🎨 Theming

CeFEM comes with 10 beautiful pre-configured themes inspired by Greek mythology. Developers can choose a single theme for their site by editing the `themeSetting` object in `src/data/config.ts`:

```typescript
export const themeSetting = {
  theme: 'zeus' 
}
```

### Available Themes:

1. `zeus` - Sky & Thunder theme
2. `poseidon` - Ocean & Seas theme
3. `hades` - Underworld theme
4. `apollo` - Sun & Light theme
5. `artemis` - Moon & Hunt theme
6. `ares` - War & Fire theme
7. `athena` - Wisdom theme
8. `hermes` - Speed theme
9. `dionysus` - Festivity theme
10. `demeter` - Nature theme

### Removing the Theme Switcher

By default, CeFEM includes a theme switcher component that allows users to change themes. For projects where you want to use a single consistent theme, you can remove the theme switcher by:

1. Open `src/layouts/Layout.astro`
2. Remove or comment out the ThemeSwitcher import:
   ```astro
   import ThemeSwitcher from "../components/ThemeSwitcher.astro";
   ```
3. Remove the ThemeSwitcher component from the body:
   ```astro
   <body data-theme={theme}>
     <Header />
     <slot />
     <Footer footerCta={footerCta} />
     <!-- Remove this line -->W
     <ThemeSwitcher />
     
     <script>
       import AOS from 'aos';
       AOS.init({
         duration: 800,
         once: true,
       });
     </script>
   </body>
   ```

This will ensure your site uses only the theme specified in your configuration.

## 📝 Content Management

CeFEM uses Astro's content collections for blog posts and other content. Add your content to the `src/content/` directory.

## 🧩 Components

CeFEM includes a wide range of components:

- **Layout Components**: Hero, Features, Split Panel, CTA Banner, etc.
- **UI Components**: Buttons, Forms, Cards, etc.
- **Blog Components**: Post cards, category pills, etc.
- **Team Components**: Team grid, member cards, etc.

## 🛠️ Commands

| Command                | Action                                           |
| :--------------------- | :----------------------------------------------- |
| `npm install`          | Install dependencies                            |
| `npm run dev`          | Start local dev server at `localhost:4321`      |
| `npm run build`        | Build your production site to `./dist/`          |
| `npm run preview`      | Preview your build locally, before deploying     |
| `npm run astro ...`    | Run CLI commands like `astro add`, `astro check` |

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Credits

- Built with [Astro](https://astro.build)
- Animations by [AOS](https://michalsnik.github.io/aos/)
- Icons from [Lucide](https://lucide.dev)
