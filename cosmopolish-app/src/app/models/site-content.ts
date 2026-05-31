export type LanguageCode = 'en' | 'pl';

export interface ContentBlock {
  title: string;
  description: string;
  icon?: string;
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

export type LocalizedSiteContent = Record<LanguageCode, SiteContent>;

export const DEFAULT_SITE_CONTENT: LocalizedSiteContent = {
  en: {
    hero: {
      title: 'Michal Orzechowski',
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
          description: 'Published in various prestigious magazines and media outlets, covering critical social and political issues.',
          icon: '📰'
        },
        {
          title: 'Film & Documentary',
          description: 'Script writer for "Wings of Freedom 1920" and director of "Casus Belli – who needs this war?"',
          icon: '🎬'
        },
        {
          title: 'Books',
          description: '"I" (2004) and "Free Tibet free China" (2008) - exploring themes of freedom and human rights.',
          icon: '📚'
        },
        {
          title: 'Human Rights',
          description: 'Authored comprehensive reports and worked with EU Parliament on international human rights issues.',
          icon: '🌍'
        },
        {
          title: 'Tibet Advocacy',
          description: 'Initiated Polish Parliamentary Caucus for Tibet, advancing awareness and support for Tibetan freedom.',
          icon: '🕊️'
        },
        {
          title: 'Bilingual Publications',
          description: 'Contributing to both Polish and English media, bridging cultural and linguistic boundaries.',
          icon: '✍️'
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
  },
  pl: {
    hero: {
      title: 'Michał Orzechowski',
      subtitle: 'Dziennikarz • Pisarz • Działacz praw człowieka',
      primaryCta: 'Poznaj więcej',
      secondaryCta: 'Skontaktuj się'
    },
    about: {
      title: 'O mnie',
      lead: 'Polski dziennikarz, pisarz i działacz praw człowieka, konsekwentnie zaangażowany w obronę wolności i demokracji.',
      paragraphs: [
        'Michał Orzechowski publikuje w mediach polskich i anglojęzycznych, nagłaśniając ważne tematy społeczne, polityczne i międzynarodowe.',
        'Jego dorobek obejmuje dziennikarstwo, książki, scenariusze filmowe, projekty dokumentalne oraz działalność publiczną związaną z prawami człowieka.',
        'Wspierał inicjatywy międzynarodowe dotyczące wolności obywatelskich, Tybetu, Gruzji i szerzej rozumianego życia publicznego w Europie.'
      ]
    },
    work: {
      title: 'Działalność zawodowa',
      items: [
        {
          title: 'Dziennikarstwo',
          description: 'Publikował w prestiżowych magazynach i mediach, opisując najważniejsze problemy społeczne oraz polityczne.',
          icon: '📰'
        },
        {
          title: 'Film i dokument',
          description: 'Autor scenariusza filmu "Skrzydła Wolności 1920" oraz reżyser dokumentu "Casus Belli – po co komu ta wojna?".',
          icon: '🎬'
        },
        {
          title: 'Książki',
          description: 'Autor książek "I" (2004) oraz "Wolny Tybet Wolne Chiny" (2008), poświęconych wolności i prawom człowieka.',
          icon: '📚'
        },
        {
          title: 'Prawa człowieka',
          description: 'Tworzył raporty i współpracował z Parlamentem Europejskim przy międzynarodowych tematach dotyczących praw człowieka.',
          icon: '🌍'
        },
        {
          title: 'Działania na rzecz Tybetu',
          description: 'Był inicjatorem Polskiego Parlamentarnego Zespołu na Rzecz Tybetu, wspierając ideę wolności Tybetu.',
          icon: '🕊️'
        },
        {
          title: 'Publikacje dwujęzyczne',
          description: 'Publikuje zarówno po polsku, jak i po angielsku, łącząc perspektywy różnych odbiorców.',
          icon: '✍️'
        }
      ]
    },
    awards: {
      title: 'Wyróżnienia i nagrody',
      items: [
        {
          year: '2019',
          title: 'Odznaka Honorowa',
          description: 'Wyróżnienie za działalność opozycyjną oraz zaangażowanie na rzecz wartości demokratycznych.'
        },
        {
          year: '2008',
          title: 'Nagroda Miasta Stołecznego Warszawy',
          description: 'Nagroda za wkład w życie publiczne i kulturalne stolicy.'
        }
      ]
    },
    contact: {
      title: 'Kontakt',
      email: 'worldsolidarity@interia.pl',
      twitterLabel: '@CosmoPolishNET',
      twitterUrl: 'https://twitter.com/CosmoPolishNET',
      quote: 'Wolność nie jest dana raz na zawsze. Trzeba o nią zabiegać z uporem i odpowiedzialnością.'
    }
  }
};
