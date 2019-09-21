import {renderToString} from 'react-dom/server';
import i18n from './i18n';

import fs from 'fs';
import path from 'path';
import {ReplaceRendererArgs as OriginalReplaceRendererArgs} from 'gatsby';
import getLangFromPathname from './utils/getLangFromPathname';
import {i18nextOptions as defaultI18nextOptions} from './defaultOptions';
import {PluginOptions} from './types';

// for some reason pathname and bodyComponetn are not present in ReplaceRendererArgs, so this is a temporary solution
interface ReplaceRendererArgs extends OriginalReplaceRendererArgs {
  pathname: string;
  bodyComponent: React.ReactElement
}

export const replaceRenderer = ({bodyComponent, pathname, replaceBodyHTMLString}: ReplaceRendererArgs, {languages = [], namespaces = [], ...options}: PluginOptions) => {
  const langFromPathname = getLangFromPathname(pathname);
  const initialLang = languages.includes(langFromPathname) ? langFromPathname : (options.defaultLng || 'en');
  const resources = languages.reduce((acc, lang) => {
    return {
      ...acc,
      [lang]: namespaces.reduce((acc, ns) => {
        const file = fs.readFileSync(path.resolve(options.localesDir, `./${lang}/${ns}.json`), 'utf8');
        const parsedTranslations = JSON.parse(file);
        return {
          ...acc,
          [ns]: parsedTranslations
        }
      }, {})
    };
  }, {})

  const i18nextOptions = options.i18next || {};

  i18n.init({
    ...defaultI18nextOptions,
    ...i18nextOptions,
    lng: initialLang,
    resources
  });

  i18n.changeLanguage(initialLang, () => {
    replaceBodyHTMLString(renderToString(bodyComponent));
  })
};
