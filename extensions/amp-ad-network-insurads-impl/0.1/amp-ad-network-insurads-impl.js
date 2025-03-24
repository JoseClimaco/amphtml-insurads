import {Deferred} from '#core/data-structures/promise';

import {Services} from '#service';

import {LockedIdGenerator} from './lockedid-generator';
import {RealtimeManager} from './realtime';

import {AmpA4A} from '../../amp-a4a/0.1/amp-a4a';
import {AmpAdNetworkDoubleclickImpl} from '../../amp-ad-network-doubleclick-impl/0.1/amp-ad-network-doubleclick-impl';

/** @type {string} */
const TAG = 'amp-ad-network-insurads-impl';
export class AmpAdNetworkInsuradsImpl extends AmpA4A {
  /**
   * @param {!Element} element
   */
  constructor(element) {
    super(element);

    // Store visibility percentage and observer
    /** @private {number} */
    this.visibilityPercentage_ = 0;

    /** @private {?IntersectionObserver} */
    this.visibilityObserver_ = null;

    /** @private {?{width: number, height: number}} */
    this.originalSize_ = null;

    /** @private {boolean} */
    this.customRefreshEnabled_ = true;

    this.queue = [];

    this.refreshCount_ = 0;

    this.initDoubleClickHelper();
    this.setupVisibilityTracking();
    this.initExtensionCommunication();

    this.slot = this.element.getAttribute('data-slot');
    this.element.setAttribute('tg-zone', this.slot);
  }

  /** @override */
  buildCallback() {
    console.log('Build Callback');
    super.buildCallback();

    // Store original size for refresh operations
    const width = Number(this.element.getAttribute('width'));
    const height = Number(this.element.getAttribute('height'));
    this.originalSize_ = {width, height};
    this.troubleshootData_.slotId = this.element.getAttribute('data-slot');
    console /*OK*/
      .log('Slot ID:', this.troubleshootData_.slotId);

    /* InsurAds Business  */
    this.lockedid = new LockedIdGenerator().getLockedIdData();
    this.rtConnection = RealtimeManager.start(this.troubleshootData_.slotId);

    console /*OK*/
      .log(this.lockedid);

    setTimeout(() => {
      this.rtConnection.send({
        'arguments': [
          '1742468581515|1742468581515|0|snap  |1|0|612394.0:1:1||||||||||',
        ],
        'target': 'SendMessage',
        'type': 1,
      });
    }, 2000);

    setTimeout(() => {
      this.sendIframeMessage('cfg', {
        sessionId: 'XPTO',
        contextId: 'C3PO',
        appId: 1,
        section: 1,
        g_country: 'PT',
      });
    }, 500);

    // const randomTimeout = Math.floor(Math.random() * 10000) + 1000;
    // setTimeout(() => {
    //   this.refresh(this.refreshEndCallback);
    // }, randomTimeout);
    /* InsurAds Business  */
  }

  /** @override */
  getAdUrl(opt_consentTuple, opt_rtcResponsesPromise, opt_serveNpaSignal) {
    this.getAdUrlDeferred = new Deferred();
    this.getAdUrlInsurAdsDeferred = new Deferred();

    const self = this;
    this.doubleClickGetAdUrl(
      opt_consentTuple,
      opt_rtcResponsesPromise,
      opt_serveNpaSignal
    );

    this.getAdUrlDeferred.promise.then((doubleClickUrl) => {
      const url = new URL(doubleClickUrl);

      // if (self.refreshCount_ > 0) {
      //   console.log('Refresh count:', self.refreshCount_);

      //   const adUrl =
      //     this.slot === '/134642692/amp-samples/amp-MREC'
      //       ? '/134642692/MREC'
      //       : '/134642692/MREC_JM';

      //   const params = url.searchParams;
      //   params.set('iu', adUrl);
      //   params.set('sz', '300x250');
      //   console /*OK*/
      //     .log(url.toString());
      // }

      self.getAdUrlInsurAdsDeferred.resolve(url.toString());
    });

    return this.getAdUrlInsurAdsDeferred.promise;
  }

  /** @override */
  refresh(refreshEndCallback) {
    if (this.isRefreshing) {
      return;
    }

    this.refreshCount_++;
    console /*Ok*/
      .log('Refresh', this.slot, this.refreshCount_, this.element, this);
    return super.refresh(refreshEndCallback);
  }

  /** @override */
  onCreativeRender(creativeMetaData, opt_onLoadPromise) {
    super.onCreativeRender(creativeMetaData);
    console /*OK*/
      .log('Creative rendered metadata:', creativeMetaData);

    // console /*OK*/
    //   .log('Creative rendered metadata:', creativeMetaData);
    // console /*OK*/
    //   .log('Refresh count:', this.customRefreshCount_);

    // setTimeout(() => {
    //   this.sendIframeMessage('tagAmpZone', {
    //     ampSlotIndex: this.element.getAttribute('data-amp-slot-index'),
    //     id: this.element.getAttribute('data-slot'),
    //   });
    // }, 1000);

    setTimeout(() => {
      this.sendIframeMessage('adUnitChanged', {
        id: this.element.getAttribute('data-slot'),
        shortId: this.element.getAttribute('data-amp-slot-index'),
        sizes: ['300x250'],
        instance: this.element.getAttribute('data-amp-slot-index'),
        configuration: null,
        customTargeting: null,
        rotation: 'Enabled',
        isFirstPrint: true,
        isTracking: false,
        visible: true,
        width: 300,
        height: 250,
        dfpMapping: null,
        isAmpSlot: true,
      });
    }, 2000);
  }

  /** @override */
  extractSize(responseHeaders) {
    console /*Ok*/
      .log('CreativeId', responseHeaders.get('google-creative-id') || '-1');
    console /*Ok*/
      .log('lineItemId', responseHeaders.get('google-lineitem-id') || '-1');

    console /*Ok*/
      .log('responseHeaders', responseHeaders);
    return super.extractSize(responseHeaders);
  }

  /**
   * Create Extension Communication Channel
   */
  initExtensionCommunication() {
    if (!this.listener) {
      !this.listenerAttacher &&
        (this.listenerAttacher = setInterval(
          () => this.initExtensionCommunication,
          2000
        ));
      this.listener = window.frames['TG-listener'];
      console.log('Initiating Extension Communication: listener not available');
    }
    if (this.listener) {
      console.log('Initiating Extension Communication: listener available');
      this.listener.addEventListener('message', this.handler.bind(this));
      this.listener.postMessage('extensionReady', '*');
      while (this.queue.length !== 0) {
        console.log('Posting message from queue', this.queue.length);
        this.listener./*Ok*/ postMessage(this.queue.shift(), '*');
      }
      if (this.listenerAttacher) {
        clearInterval(this.listenerAttacher);
      }
    }
  }

  /**
   * @param msg
   */
  handler(msg) {
    if (msg.data.adUnitId !== this.slot) {
      return;
    }
    console /*OK*/
      .log('Message received from extension:', msg);
    switch (msg.data.action) {
      case 'changeBanner':
        this.refresh(this.refreshEndCallback);
        break;
    }
  }

  /**
   * @param type
   * @param data
   */
  sendIframeMessage(type, data) {
    const msg = {
      type,
      data,
    };
    console /*OK*/
      .log('Posting message to extension:', msg);

    this.queue.push(msg);
    this.initExtensionCommunication();
  }

  /**
   * Enables the use of the DoubleClick implementation.
   */
  initDoubleClickHelper() {
    /** @protected {!Deferred<string>} */
    this.getAdUrlDeferred = new Deferred();

    this.getAdUrlInsurAdsDeferred = new Deferred();

    /** @private {!TroubleshootDataDef} */
    this.troubleshootData_ = /** @type {!TroubleshootDataDef} */ ({});

    // AmpAdNetworkInsuradsImpl.prototype.getAdUrl =
    //   AmpAdNetworkDoubleclickImpl.prototype.getAdUrl;

    AmpAdNetworkInsuradsImpl.prototype.doubleClickGetAdUrl =
      AmpAdNetworkDoubleclickImpl.prototype.getAdUrl;

    AmpAdNetworkInsuradsImpl.prototype.populateAdUrlState =
      AmpAdNetworkDoubleclickImpl.prototype.populateAdUrlState;

    AmpAdNetworkInsuradsImpl.prototype.generateAdKey_ =
      AmpAdNetworkDoubleclickImpl.prototype.generateAdKey_;

    AmpAdNetworkInsuradsImpl.prototype.getParameterSize_ =
      AmpAdNetworkDoubleclickImpl.prototype.getParameterSize_;

    AmpAdNetworkInsuradsImpl.prototype.expandJsonTargeting_ =
      AmpAdNetworkDoubleclickImpl.prototype.expandJsonTargeting_;

    AmpAdNetworkInsuradsImpl.prototype.mergeRtcResponses_ =
      AmpAdNetworkDoubleclickImpl.prototype.mergeRtcResponses_;

    AmpAdNetworkInsuradsImpl.prototype.getPageParameters =
      AmpAdNetworkDoubleclickImpl.prototype.getPageParameters;

    AmpAdNetworkInsuradsImpl.prototype.getBlockParameters_ =
      AmpAdNetworkDoubleclickImpl.prototype.getBlockParameters_;

    AmpAdNetworkInsuradsImpl.prototype.getLocationQueryParameterValue =
      AmpAdNetworkDoubleclickImpl.prototype.getLocationQueryParameterValue;

    this.canonicalUrl = Services.documentInfoForDoc(this.element).canonicalUrl;
    console /*OK*/
      .log('Canonical URL:', this.canonicalUrl);
  }

  /**
   * refreshEndCallback
   *
   */
  refreshEndCallback() {
    console /*OK*/
      .log('Refresh End Callback');
  }

  /**
   * Sets up visibility tracking using IntersectionObserver
   */
  setupVisibilityTracking() {
    // [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]
    const thresholds = Array.from({length: 11}, (_, i) => i / 10);

    this.visibilityObserver_ = new this.win.IntersectionObserver(
      (entries) => this.handleVisibilityChange_(entries),
      {
        threshold: thresholds,
      }
    );

    this.visibilityObserver_.observe(this.element);
  }

  /**
   * Handles intersection changes reported by the IntersectionObserver
   * @param {!Array<!IntersectionObserverEntry>} entries
   * @private
   */
  handleVisibilityChange_(entries) {
    entries.forEach((entry) => {
      const previousVisibility = this.visibilityPercentage_;
      this.visibilityPercentage_ = entry.intersectionRatio;

      const visibilityChanged =
        Math.abs(this.visibilityPercentage_ - previousVisibility) >= 0.1;
      if (visibilityChanged) {
        console /*OK*/
          .log(
            'Ad visibility:',
            Math.round(this.visibilityPercentage_ * 100) + '%'
          );
        // console /*OK*/
        //   .log('boundingClientRect:', entry.boundingClientRect);
        // console /*OK*/
        //   .log('intersectionRect:', entry.intersectionRect);
      }
    });
  }
}

AMP.extension(TAG, '0.1', (AMP) => {
  AMP.registerElement(TAG, AmpAdNetworkInsuradsImpl);
});
