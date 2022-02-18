import React, { Component } from 'react'
import {
  Footer} from 'hds-react'
import { connect } from 'react-redux'
import { fetchFooter } from '../../actions/footerActions'
import { footerSelector } from '../../selectors/footerSelector'
import { isArray } from 'lodash'
import { withTranslation } from 'react-i18next'
class CustomFooter extends Component {
  componentDidMount() {
    this.props.fetchFooter()
  }

  renderHeader = header => {
     return (
        <div className="align-left">
        <Footer.Item
          as="span"
          label={header.title}
          onClick={function noRefCheck() {}}
        />
        {this.renderFooterLinks(header.links)}
      </div>
    )
  }
  renderFooterLinks = links => {
    const returnValue = []
    links.forEach( link => {
      returnValue.push(
        <Footer.Item
          as="a"
          href={link.url}
          label={link.link_text}
          onClick={function noRefCheck() {}}
          subItem
          key={link.url}
        />

      )
    })
    return returnValue
  }

  renderAllNavigation = () => {
    const returnValue = []

    if ( !this.props.footerData || !isArray( this.props.footerData )) {
        return null
    }
   this.props.footerData.forEach(current => {
      returnValue.push(
          <Footer.ItemGroup key={current.title}>{this.renderHeader(current)}</Footer.ItemGroup>
      )
    })

    return returnValue
  }

  renderTitle = () => {
    const {t} = this.props
    return (
      <>
        <div>{t('footer.footer-info.area')}</div>
        <div>{t('footer.footer-info.name')}</div>
        <div>{t('footer.footer-info.address')}</div>
      </>
    )
  }

  render() {
    const {t} = this.props
    return (
      <Footer
        footerProps={{
          lang: 'fi'
        }}
        korosType="basic"
        logoLanguage="fi"
        title={this.renderTitle()}
      >
        <Footer.Navigation
          navigationAriaLabel="Footer navigation items"
          variant="minimal"
        >
          {this.renderAllNavigation()}
        </Footer.Navigation>
        <Footer.Utilities backToTopLabel={t('footer.to-start')}/>
          
        <Footer.Base
          copyrightHolder={t('footer.copyright-holder')}
          copyrightText={t('footer.copyright-text')}
        />
      </Footer>
    )
  }
}

const mapDispatchToProps = {
  fetchFooter
}

const mapStateToProps = state => {
  return {
    footerData: footerSelector(state)
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(withTranslation()(CustomFooter))
