export interface ContentBlock {
  title: string;
  description: string;
}

export interface AwardItem {
  year: string;
  title: string;
  description: string;
}

export interface SiteContent {
  hero: {
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
  };
  about: {
    title: string;
    lead: string;
    paragraphs: string[];
  };
  work: {
    title: string;
    items: ContentBlock[];
  };
  awards: {
    title: string;
    items: AwardItem[];
  };
  contact: {
    title: string;
    email: string;
    twitterLabel: string;
    twitterUrl: string;
    quote: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: {
    title: 'Michał Orzechowski',
    subtitle: 'Journalist • Writer • Human Rights Activist',
    primaryCta: 'Discover More',
    secondaryCta: 'Get in Touch'
  },
  about: {
    title: 'About',
    lead: 'Polish journalist, writer, and dedicated human rights activist with a strong commitment to freedom and democracy.',
    paragraphs: [
      'Michal Orzechowski publishes in Polish and English media, bringing social and political issues to international audiences.',
      'His work spans journalism, books, film scripts, documentary projects, and advocacy focused on democratic values and civil liberties.',
      'He has supported international human rights initiatives and worked on projects connected with Tibet, Georgia, and broader European public life.'
    ]
  },
  work: {
    title: 'Professional Work',
    items: [
      {
        title: 'Journalism',
        description: 'Published in magazines and media outlets covering social, political, and international issues.'
      },
      {
        title: 'Film & Documentary',
        description: 'Author of film scripts and documentary projects addressing freedom, war, and political responsibility.'
      },
      {
        title: 'Books',
        description: 'Writer of books exploring freedom, identity, and the political condition of modern societies.'
      }
    ]
  },
  awards: {
    title: 'Recognition & Awards',
    items: [
      {
        year: '2019',
        title: 'Badge of Honor',
        description: 'Recognition for anti-communist opposition activity and commitment to democratic values.'
      },
      {
        year: '2008',
        title: 'City of Warszawa Merit Award',
        description: 'Awarded for public and cultural contribution to the city of Warsaw.'
      }
    ]
  },
  contact: {
    title: 'Get in Touch',
    email: 'worldsolidarity@interia.pl',
    twitterLabel: '@CosmoPolishNET',
    twitterUrl: 'https://twitter.com/CosmoPolishNET',
    quote: 'Freedom is not given, it is won through persistent dedication and unwavering commitment to human rights.'
  }
};
