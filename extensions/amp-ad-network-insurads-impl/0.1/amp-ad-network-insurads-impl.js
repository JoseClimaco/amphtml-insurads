import {Deferred} from '#core/data-structures/promise';

import {Services} from '#service';

import {LockedIdGenerator} from './lockedid-generator';

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

    this.refreshCount_ = 0;

    /* InsurAds Business  */
    this.lockedid = new LockedIdGenerator().getLockedIdData();
    /* InsurAds Business  */

    console /*OK*/
      .log(this.lockedid);

    this.initDoubleClickHelper();
    this.addWebSocketCommunication();
    this.setupVisibilityTracking();
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

    // setTimeout(() => {
    //   // this.initiateCustomRefresh();
    //   this.refresh(this.refreshEndCallback);
    // }, 2000);
  }

  /** @override */
  buildCallback() {
    console.log('Build Callback');
    super.buildCallback();

    // Store original size for refresh operations
    const width = Number(this.element.getAttribute('width'));
    const height = Number(this.element.getAttribute('height'));
    this.originalSize_ = {width, height};
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

      if (self.refreshCount_ > 0) {
        console.log('Refresh count:', self.refreshCount_);

        const params = url.searchParams;
        params.set('iu', '/30497360/a4a/a4a_native');
        params.set('sz', '300x250');
        console /*OK*/
          .log(url.toString());
      }

      self.getAdUrlInsurAdsDeferred.resolve(url.toString());
    });

    return this.getAdUrlInsurAdsDeferred.promise;
  }

  /** @override */
  refresh(refreshEndCallback) {
    this.refreshCount_++;
    console /*Ok*/
      .log('Refresh');
    return super.refresh(refreshEndCallback);
  }

  // /** @override */
  // onCreativeRender(creativeMetaData, opt_onLoadPromise) {
  //   super.onCreativeRender(creativeMetaData);

  //   console /*OK*/
  //     .log('Creative rendered metadata:', creativeMetaData);
  //   console /*OK*/
  //     .log('Refresh count:', this.customRefreshCount_);

  //   // Add attribute to indicate this was a refreshed creative
  //   if (this.customRefreshCount_ > 0) {
  //     this.element.setAttribute(
  //       'data-refresh-count',
  //       String(this.customRefreshCount_)
  //     );
  //   }

  //   // Reset refresh flags to ensure clean state
  //   this.isCustomRefreshing_ = false;
  //   this.isRefreshing = false;

  //   // Handle completion callback
  //   opt_onLoadPromise &&
  //     opt_onLoadPromise
  //       .then((data) => {
  //         console /*OK*/
  //           .log('Creative rendered onloadpromise results:', data);

  //         // Track successful render for analytics
  //         if (
  //           this.customRefreshCount_ > 0 &&
  //           this.ws &&
  //           this.ws.readyState === WebSocket.OPEN
  //         ) {
  //           this.ws.send(
  //             JSON.stringify({
  //               type: 'creative_rendered',
  //               data: {
  //                 adId: this.element.id || 'unknown',
  //                 refreshCount: this.customRefreshCount_,
  //                 timestamp: Date.now(),
  //               },
  //             })
  //           );
  //         }
  //       })
  //       .catch((err) => {
  //         console /*OK*/
  //           .error('Error in onLoadPromise:', err);
  //       });
  // }

  /** @override */
  extractSize(responseHeaders) {
    console /*Ok*/
      .log('CreativeId', responseHeaders.get('google-creative-id') || '-1');
    console /*Ok*/
      .log('lineItemId', responseHeaders.get('google-lineitem-id') || '-1');
    return super.extractSize(responseHeaders);
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
   * Add WebSocket communication.
   */
  addWebSocketCommunication() {
    const hubUrl =
      'wss://amp-messaging.insurads.com/rt-pub/node/hub?appId=78&dev=Smartphone&br=Safari&os=iOS&cc=PT&rc=11&v=0.2';

    // const hubUrl =
    //   'wss://web-messaging.insurads.com/rt-pub/node/hub?appId=327&lockedId=63409be2f654defd2c25203fa6b4acb0&url=https%3A%2F%2Fwww.record.pt%2F&dev=Personal%20computer&br=Chrome&os=Others&cc=PT&rc=11&ct=Odivelas&isp=&ht=1&v=0.5';
    console.log('Hub URL:', hubUrl);

    // create websocket connection
    const ws = new WebSocket(hubUrl);

    // Connection opened
    ws.addEventListener('open', function (event) {
      ws.send('{"protocol":"json","version":1}');
    });

    // Listen for messages
    ws.addEventListener('message', (event) => {
      console /*Ok*/
        .log('Message from server ', event.data);

      // this.refresh(this.refreshEndCallback);
    });

    // Connection closed
    ws.addEventListener('close', function (event) {
      console.log('Connection closed');
    });
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
