import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Segment } from 'semantic-ui-react'

class Terms extends Component {
  constructor(props) {
    super(props)

    this.state = {}
  }

  componentDidMount() {
    document.title = 'Kaavapino'
  }
  render() {
    return (
      <Container centered>
        <Segment>
          <p>
            <strong>Alustava versio käyttöehdoiksi, 15.6.2020 Arja Kasanen</strong>
          </p>

          <p>
            <strong>Käyttöehdot</strong>
          </p>
          <p>
            Sovellus on tarkoitettu asemakaavaprojektien tietojenhallintaan. Kyseessä on
            kaupungin sisäinen työkalu.
          </p>
          <p>
            <strong>Käyttäjän tunnistaminen </strong>
          </p>
          <p>
            Kaavapinoon kirjaudutaan omalla AD-tunnuksella, jolla työntekijä tunnistetaan
            kaupungin tietojärjestelmissä. Käyttäjäroolit (vastuuhenkilö/projektin
            vastuuhenkilö, asiantuntijalla, selaaja) määrittyvät automaattisesti AD-ryhmän
            perusteella. Pääkäyttäjällä on oikeus muokata käyttäjärooleja.
          </p>
          <p>
            <strong>Oikeus katsella tietoja</strong>
          </p>
          <p>
            Kaikki Kaavapinon käyttäjät voivat katsella kaikkien projektien
            tilannetietoja. Tiedot täydentyvät ja muuttuvat valmisteluprosessin aikana, ja
            niiden kattavuudessa ja laadussa saattaa olla puutteita. Tapauksissa, joissa
            tarvitaan ehdottoman luotettavia tietoja, tulee tietojen oikeellisuus
            tarkistaa projektin vastuuhenkilöltä.
          </p>
          <p>
            <strong>Oikeus syöttää tietoja </strong>
          </p>
          <p>
            Vastuuhenkilöllä/Projektin vastuuhenkilöllä, Asiantuntijalla ja Pääkäyttäjällä
            on oikeus syöttää projektien tietoja. Tiedon syöttäjän nimi, ajankohta ja
            muutoksen sisältö tallentuvat ja siitä jää merkintä lokiin. Kaavapinoon ei saa
            syöttää salassa pidettäviä tietoja. Projektin vastuuhenkilö voi merkitä
            projektinsa tiedot ei-näkyväksi projektin alkuvaiheen ajan.
          </p>
          <p>
            <strong>Vastuu tiedoista</strong>
          </p>
          <p>
            Tiedon syöttäjä on vastuussa syöttämistään tiedoista. Projekti vastuuhenkilö
            on kuitenkin vastuussa kaikista oman projektinsa tiedoista lukuun ottamatta
            niitä tietoja, joiden syöttöoikeus on vain pääkäyttäjällä.
          </p>
          <p>
            <strong>Palaute</strong>
          </p>
          <p>
            Kaavapinoon liittyvää palautetta voi antaa jokaisella sivulla sijaitsevan
            Palaute-linkin kautta.
          </p>
          <p>
            <strong>Rekisteriseloste</strong>
          </p>
          <p>
            Kaupunki kerää henkilötietoja siinä määrin kuin se on tarpeellista asian
            hoitamiseksi. Kaikki tiedot on kerätty eri rekistereihin tietojen
            käyttötarkoitusten mukaan. Rekistereistä on laadittu rekisteriselosteet
            (www.hel.fi/rekisteriseloste). Kaavapinossa käsitellään henkilötietoja{' '}
            <a href="https://www.hel.fi/static/liitteet/kanslia/rekisteriselosteet/Kymp/Kymp-EU-Kaavoitus-poikkeamismenettely-suunnittelutarveratkaisu-rakennuskielto-prosessien-rekisteri.pdf">
              Kaavoitus-, poikkeamismenettely-, suunnittelutarveratkaisu- ja
              rakennuskieltoprosessien lähtötietojen, vireilletulon, osallisuuden ja
              palautteiden rekisteriselosteessa
            </a>{' '}
            kuvatulla tavalla.
          </p>
          <p>
            <strong>Evästeet</strong>
          </p>
          <p>
            Evästeiden avulla voidaan kerätä tietoa käyttäjistä sovelluksen
            parantamiseksi. Käyttäjäseurannan osalta evästeet sisältävät nimettömän,
            yksilöllisen tunnisteen, jonka avulla saadaan tietoa käyttäjistä, muun muassa
            heidän selaimistaan ja päätelaitteistaan.
          </p>
          <p>
            <strong>Sisällön lisenssointi</strong>
          </p>
          <p>
            Sovellus on julkaistu avoimella lähdekoodilla ja se perustuu avoimiin
            rajapintoihin.
          </p>
          <p>
            <strong>Hyväksy käyttöehdot</strong>
          </p>
          <p>Kieltäydy hyväksymästä ehtoja</p>
          <p>Hyväksyn nämä ehdot</p>
        </Segment>
      </Container>
    )
  }
}
export default connect(null)(Terms)
