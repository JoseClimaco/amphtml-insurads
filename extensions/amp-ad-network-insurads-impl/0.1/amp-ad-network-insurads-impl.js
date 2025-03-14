import {Deferred} from '#core/data-structures/promise';

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

    /* InsurAds Business  */
    this.lockedid = new LockedIdGenerator().getLockedIdData();
    /* InsurAds Business  */

    console /*OK*/
      .log(this.lockedid);

    this.initDoubleClickHelper();
    this.addWebSocketCommunication();
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

    // AmpAdNetworkInsuradsImpl.prototype.doubleClickGetAdUrl = function () {
    //   const doubleClickUrlPromise =
    //     AmpAdNetworkDoubleclickImpl.prototype.getAdUrl.call(this);

    //   doubleClickUrlPromise.then((doubleClickUrl) => {
    //     const url = new URL(doubleClickUrl);

    //     const params = url.searchParams;
    //     params.set('iu', '/134642692/amp-samples/amp-MREC');
    //     params.set('sz', '300x250');

    //     return url.toString();
    //   });
    // };

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
  }

  /** @override */
  getAdUrl(opt_consentTuple, opt_rtcResponsesPromise, opt_serveNpaSignal) {
    this.doubleClickGetAdUrl(
      opt_consentTuple,
      opt_rtcResponsesPromise,
      opt_serveNpaSignal
    );

    this.getAdUrlDeferred.promise.then((doubleClickUrl) => {
      const url = new URL(doubleClickUrl);

      const params = url.searchParams;
      params.set('iu', '/30497360/a4a/a4a_native');
      params.set('sz', '300x250');
      console /*OK*/
        .log(url.toString());

      this.getAdUrlInsurAdsDeferred.resolve(url.toString());
    });

    return this.getAdUrlInsurAdsDeferred.promise;
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
    ws.addEventListener('message', function (event) {
      console.log('Message from server ', event.data);
    });

    // Connection closed
    ws.addEventListener('close', function (event) {
      console.log('Connection closed');
    });
  }
}

AMP.extension(TAG, '0.1', (AMP) => {
  AMP.registerElement(TAG, AmpAdNetworkInsuradsImpl);
});
