# VirniAngularStore

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.4.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Deploying to Netlify

The repository includes `netlify.toml`. Import this repository in Netlify and use the default build settings from that file:

- Build command: `npm run build:netlify`
- Publish directory: `dist/VirniAngularStore/browser`
- Node.js: 20

The build generates product and news pages, `sitemap.xml`, `robots.txt`, and social preview images. Its canonical URLs use `https://virni.top/`.

### Connecting `virni.top`

1. Deploy the site once on Netlify, then open **Domain management** for that site and add `virni.top` and `www.virni.top`. Choose `virni.top` as the primary domain.
2. In the domain's DNS settings at Ukraine.com.ua, point the apex (`@`) to Netlify using an ALIAS/ANAME record to `apex-loadbalancer.netlify.com`, if supported. Otherwise use an A record to `75.2.60.5`.
3. Add a CNAME for `www` pointing to the site's Netlify subdomain (for example, `your-site.netlify.app`). Use the actual subdomain shown in Netlify.
4. Remove only conflicting old website records for `@` and `www` (for example, old GitHub Pages A/AAAA/CNAME records). Keep unrelated mail (MX), verification (TXT), and other DNS records.
5. Wait for DNS propagation, then return to Netlify and verify the domain and enable HTTPS. Netlify provisions the TLS certificate after DNS is correct.
6. Test `https://virni.top/`, `https://www.virni.top/`, a generated product/news URL, and `/sitemap.xml`. Submit the sitemap in Google Search Console if the domain is verified there.

The DNS changes are made at the DNS provider currently authoritative for the domain. If Ukraine.com.ua delegates DNS to external nameservers, make these changes at that DNS provider instead.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
