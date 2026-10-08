import re

import requests
from bs4 import BeautifulSoup


class DataScraping:
    """Busca artigos no BibDigital/URLib do INPE, filtrando por autores conhecidos."""

    BASE_URL = "http://bibdigital.sid.inpe.br/col/sid.inpe.br/bibdigital@80/2006/04.07.15.50.13/doc"
    FORM_URL = f"{BASE_URL}/mirror.cgi?forcehistorybackflag=0"
    SEARCH_URL = f"{BASE_URL}/mirrorsearch.cgi?languagebutton=en&choice=brief&outputformat=1&returnbutton=yes"

    SECTION_PATTERN = re.compile(r"<!--\s*(.*?)\s*-->", re.DOTALL)

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "Mozilla/5.0"})

    def search_by_authors(self, authors):
        """
        authors: lista de nomes completos (ex: "Alberto Waingort Setzer").

        Busca por primeiro nome E por sobrenome, não só um dos dois: sobrenomes
        comuns (Almeida, Martins, Carvalho...) e também primeiros nomes comuns
        (Alberto, Ryan...) podem ter milhares de referências no BibDigital, e
        só os 10 resultados mais recentes são retornados por busca - os
        artigos da pessoa procurada ficam enterrados e nunca aparecem se a
        gente só tentar um dos dois. Qual dos dois é "raro" varia de pessoa
        pra pessoa, então buscamos os dois e validamos sobrenome + inicial
        depois, em _author_matches.

        Retorna uma lista de artigos únicos (por identifier/citation_key), cada um
        com a lista de autores da config que deram match.
        """
        articles_by_key = {}
        for author in authors:
            tokens = author.split()
            query_terms = {tokens[0].strip(), tokens[-1].strip()}
            for query_term in query_terms:
                soup = self._search(f"au {query_term}")
                for article in self._parse_results(soup):
                    full_metadata = None
                    if not self._author_matches(article["authors"], author):
                        # a listagem resumida corta a lista em "et al." quando há
                        # muitos autores, escondendo coautores - só descarta se a
                        # lista exibida já estiver completa (sem "et al.")
                        if not article["authors"].rstrip().endswith("et al."):
                            continue
                        full_metadata = self._fetch_full_metadata(article["full_metadata_url"])
                        if not full_metadata or not self._author_matches(full_metadata["authors"] or "", author):
                            continue

                    key = article["identifier"] or article["citation_key"]
                    if key not in articles_by_key:
                        if full_metadata is None:
                            full_metadata = self._fetch_full_metadata(article["full_metadata_url"])
                        article["authors"] = (full_metadata and full_metadata["authors"]) or article["authors"]
                        article["doi"] = full_metadata and full_metadata["doi"]
                        if article["doi"]:
                            article["link"] = f"https://doi.org/{article['doi']}"
                        article.pop("full_metadata_url", None)
                        article["matched_authors"] = []
                        articles_by_key[key] = article
                    if author not in articles_by_key[key]["matched_authors"]:
                        articles_by_key[key]["matched_authors"].append(author)

        return self._dedupe_by_doi(list(articles_by_key.values()))

    @staticmethod
    def _dedupe_by_doi(articles):
        """
        O mesmo artigo é por vezes catalogado mais de uma vez no BibDigital,
        por sites/unidades diferentes do INPE, cada um com seu próprio
        identificador interno. O DOI é o identificador real da publicação,
        então usamos ele pra unificar essas cópias quando disponível.
        """
        merged = []
        seen_by_doi = {}
        for article in articles:
            doi = article.get("doi")
            existing = seen_by_doi.get(doi) if doi else None
            if existing:
                for author in article["matched_authors"]:
                    if author not in existing["matched_authors"]:
                        existing["matched_authors"].append(author)
                continue
            merged.append(article)
            if doi:
                seen_by_doi[doi] = article
        return merged

    def _fetch_full_metadata(self, metadata_url):
        if not metadata_url:
            return None
        response = self.session.get(metadata_url, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        return {
            "authors": self._extract_full_authors(soup),
            "doi": self._extract_field(soup, "DOI"),
        }

    @staticmethod
    def _extract_field(soup, label):
        for td in soup.find_all("td"):
            if td.get_text(strip=True) == label:
                value_td = td.find_next_sibling("td")
                if value_td:
                    return value_td.get_text(strip=True) or None
        return None

    def _extract_full_authors(self, soup):
        for td in soup.find_all("td"):
            if td.get_text(strip=True) == "Author":
                value_td = td.find_next_sibling("td")
                if not value_td:
                    return None
                # <br> separa cada autor, mas o sobrenome buscado vem destacado
                # em <b>, quebrando o nome em vários nós de texto - substituir
                # <br> por um marcador evita que get_text() junte tudo errado
                for br in value_td.find_all("br"):
                    br.replace_with("\n")
                names = []
                for line in value_td.get_text().split("\n"):
                    name = re.sub(r"^\d+\s*", "", line).strip()
                    if name:
                        names.append(name)
                return "; ".join(names) if names else None
        return None

    def _get_session_tokens(self):
        response = self.session.get(self.FORM_URL, timeout=15)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        publickey = soup.find("input", {"name": "publickey"})["value"]
        sessiontime = soup.find("input", {"name": "sessiontime"})["value"]
        return publickey, sessiontime

    def _search(self, query):
        publickey, sessiontime = self._get_session_tokens()
        payload = {
            "passwordstate": "no",
            "displaystate": "showalldisplayed",
            "firstclick": "1",
            "einputbackup": "",
            "targetframe": "display___sid_inpe_br__bibdigital_80__2006__04_07_15_50_13",
            "query2": "",
            "username": "administrator",
            "codedpassword1": "",
            "accent": "false",
            "case2": "false",
            "choice": "brief",
            "formchoice": "brief",
            "sort": "",
            "formsort": "key",
            "query": query,
            "onclickevent": "0",
            "newCookieSearch": "0",
            "targetvalue": "_top",
            "searchinputvalue": query,
            "forcehistorybackflag": "0",
            "forcerecentflag": "0",
            "easyquery": query,
            "easyqueryaux": "",
            "sessiontime": sessiontime,
            "publickey": publickey,
        }
        response = self.session.post(self.SEARCH_URL, data=payload, timeout=15)
        response.raise_for_status()
        return BeautifulSoup(response.text, "html.parser")

    def _parse_results(self, soup):
        articles = []
        for td in soup.find_all("td", class_="displayTD"):
            sections = self._split_sections(str(td))
            articles.append(self._parse_article(sections))
        return articles

    def _split_sections(self, html):
        parts = self.SECTION_PATTERN.split(html)
        sections = {}
        for i in range(1, len(parts) - 1, 2):
            sections[parts[i].strip()] = parts[i + 1]
        return sections

    def _parse_article(self, sections):
        citation_key = self._text(sections.get("citationKey", ""))

        reference_type = self._text(sections.get("referenceType", ""))
        reference_type = reference_type.split("-m-")[0].strip()

        authors_text = self._text(sections.get("author and year", ""))
        authors, year = self._split_authors_and_year(authors_text)

        title_soup = BeautifulSoup(sections.get("title", ""), "html.parser")
        title_link = title_soup.find("a")
        title = title_link.get_text(strip=True) if title_link else title_soup.get_text(strip=True)
        link = title_link["href"] if title_link and title_link.has_attr("href") else None

        metadata_soup = BeautifulSoup(sections.get("metadata", ""), "html.parser")
        metadata_link = metadata_soup.find("a")
        full_metadata_url = metadata_link["href"] if metadata_link and metadata_link.has_attr("href") else None

        identifier_soup = BeautifulSoup(sections.get("identifier", ""), "html.parser")
        clipboard_values = [
            button.get("data-clipboard-text")
            for button in identifier_soup.find_all("clipboardbutton")
        ]
        identifier = clipboard_values[1] if len(clipboard_values) > 1 else None

        return {
            "citation_key": citation_key,
            "reference_type": reference_type,
            "authors": authors,
            "year": year,
            "title": title,
            "link": link,
            "full_metadata_url": full_metadata_url,
            "identifier": identifier,
            "source": "bibdigital_inpe",
        }

    @staticmethod
    def _text(html):
        return BeautifulSoup(html, "html.parser").get_text(" ", strip=True)

    @staticmethod
    def _split_authors_and_year(authors_text):
        match = re.search(r":(\d{4}):?\s*$", authors_text)
        if not match:
            authors = authors_text
            year = None
        else:
            authors = authors_text[: match.start()].strip().rstrip(":").strip()
            year = match.group(1)
        authors = re.sub(r"\s+,", ",", authors)
        return authors, year

    @staticmethod
    def _author_matches(authors_text, author):
        """
        Exige sobrenome (último nome) + inicial do primeiro nome, não só o
        sobrenome. Sobrenomes comuns (ex: "Martins", "Almeida") sozinhos
        geram falsos positivos, já que aparecem como coautor de pessoas que
        não têm nada a ver com quem estamos procurando.
        """
        tokens = author.split()
        surname = tokens[-1]
        first_initial = tokens[0][0]

        pattern = re.compile(r"\b" + re.escape(surname) + r"\b\s*,\s*([^\s,;]{1})", re.IGNORECASE)
        for match in pattern.finditer(authors_text):
            if match.group(1).upper() == first_initial.upper():
                return True
        return False
