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
          onClick={function noRefCheck() {}}
        />
        {this.renderFooterLinks(header.links)}
      </div>
    )
  }
  renderFooterLinks = links => {
    const returnValue = []
    links.forEach( link => {
      if(link.link_text !== "Anna palautetta"){
        returnValue.push(
          <Footer.Item
            as="a"
            href={link.url}
            label={link.link_text}
            onClick={function noRefCheck() {}}
            key={link.url}
          />
        )
      }
    })
    return returnValue
  }

  renderFeedbackLink = links => {
    const returnValue = []
    links.forEach( link => {
      if(link.link_text === "Anna palautetta"){
        returnValue.push(
          <Footer.Item
            as="a"
            href={link.url}
            label={link.link_text}
            onClick={function noRefCheck() {}}
            key={link.url}
          />
        )
      }
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

  renderFeedback = () => {
    const returnValue = []

    if ( !this.props.footerData || !isArray( this.props.footerData )) {
        return null
    }
   this.props.footerData.forEach(current => {
      returnValue.push(this.renderFeedbackLink(current.links))
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
    const pathToCheck = location?.pathname
    
    if(pathToCheck?.endsWith('/edit')){
      return(
        <></>
      )
    }
    else{
      return (
        <Footer
          footerProps={{
            lang: 'fi'
          }}
          korosType="basic"
          logoLanguage="fi"
          title={this.renderTitle()}
        >
          <div className="align-left">
          <Footer.Navigation
            navigationAriaLabel="Footer navigation items"
            variant="minimal"
          >
            {this.renderAllNavigation()}
          </Footer.Navigation>
          </div>
          <div className="align-right">
            <Footer.Utilities backToTopLabel={t('footer.to-start')}>
              {this.renderFeedback()}
            </Footer.Utilities>
          </div>
            
          <Footer.Base
            copyrightHolder={t('footer.copyright-holder')}
            copyrightText={t('footer.copyright-text')}
          />
        </Footer>
      )
    }
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
