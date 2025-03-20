
  /**
   * Implements custom short-interval ad refresh functionality
   */
  setupCustomRefresh() {
    /** @private {number} */
    this.customRefreshCount_ = 0;

    /** @private {?number} */
    this.customRefreshTimerId_ = null;

    /** @private {boolean} */
    this.isCustomRefreshing_ = false;

    /** @private {boolean} */
    this.customRefreshEnabled_ = true;

    // // Get refresh interval from data attribute (in seconds)
    // const refreshIntervalAttr = this.element.getAttribute(
    //   'data-custom-refresh-interval'
    // );

    const refreshIntervalAttr = 10;

    /** @private {number} */
    this.customRefreshInterval_ = refreshIntervalAttr
      ? parseInt(refreshIntervalAttr, 10) * 1000
      : 15000; // default 15 seconds

    // Create scheduler service for timing
    /** @private {!../../../src/service/timer-impl.Timer} */
    this.timer_ = Services.timerFor(this.win);

    // Setup visibility observer for smart refresh timing
    this.setupVisibilityTracking();

    console /*OK*/
      .log(
        'Custom refresh initialized with interval:',
        this.customRefreshInterval_ / 1000,
        'seconds'
      );
  }

  /**
   * Initiates custom refresh cycle based on visibility
   */
  initiateCustomRefresh() {
    // Don't schedule if already refreshing or disabled
    if (this.isCustomRefreshing_ || !this.customRefreshEnabled_) {
      return;
    }

    // Clear any existing timers
    if (this.customRefreshTimerId_) {
      this.timer_.cancel(this.customRefreshTimerId_);
      this.customRefreshTimerId_ = null;
    }

    // Only schedule refresh when ad is visible
    if (this.visibilityPercentage_ >= 0.5) {
      this.customRefreshTimerId_ = this.timer_.delay(() => {
        this.executeCustomRefresh();
      }, this.customRefreshInterval_);

      console /*OK*/
        .log(
          'Ad refresh scheduled in',
          this.customRefreshInterval_ / 1000,
          'seconds'
        );
    } else {
      // Add one-time listener to start refresh when ad becomes visible
      const visibilityListener = (e) => {
        if (e.detail.visibilityPercentage >= 0.5) {
          this.initiateCustomRefresh();
          // Remove listener after triggering
          this.element.removeEventListener(
            'amp-ad-visibility-change',
            visibilityListener
          );
        }
      };
      this.element.addEventListener(
        'amp-ad-visibility-change',
        visibilityListener
      );

      console /*OK*/
        .log('Ad not visible, refresh will be scheduled when visible');
    }
  }

  /**
   * Executes the actual ad refresh
   * @return {!Promise}
   */
  executeCustomRefresh() {
    // Don't refresh if already in progress
    if (this.isCustomRefreshing_) {
      console /*OK*/
        .log('Already refreshing, skipping duplicate refresh');
      return Promise.resolve();
    }

    console /*OK*/
      .log('Executing custom ad refresh');

    // Mark as refreshing
    this.isCustomRefreshing_ = true;
    this.isRefreshing = true;
    this.customRefreshCount_++;

    // Report refresh to analytics if needed
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'refresh_started',
          data: {
            adId: this.element.id || 'unknown',
            refreshCount: this.customRefreshCount_,
            timestamp: Date.now(),
          },
        })
      );
    }

    // Execute the actual refresh with timeout protection
    const refreshPromise = new Promise((resolve) => {
      // Step 1: Tear down existing ad
      this.tearDownSlot();

      // Step 2: Force relayout request
      this.getResource().layoutCanceled();

      // Step 3: Request layout with appropriate size
      this.attemptChangeSize(
        this.originalSize_.height,
        this.originalSize_.width
      )
        .then(() => {
          console /*OK*/
            .log('Size change successful, laying out new ad');

          // Step 4: Wait for layout to complete
          this.layoutCallback()
            .then(() => {
              console /*OK*/
                .log('Layout completed after refresh');

              // Reset refresh flags
              this.isCustomRefreshing_ = false;
              this.isRefreshing = false;

              // Schedule the next refresh
              setTimeout(() => {
                this.initiateCustomRefresh();
              }, 0);

              resolve();

              // Report refresh completion
              if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(
                  JSON.stringify({
                    type: 'refresh_completed',
                    data: {
                      adId: this.element.id || 'unknown',
                      refreshCount: this.customRefreshCount_,
                      timestamp: Date.now(),
                    },
                  })
                );
              }
            })
            .catch((error) => {
              console /*OK*/
                .error('Layout failed after refresh:', error);
              // Reset flags on layout error
              this.isCustomRefreshing_ = false;
              this.isRefreshing = false;
              resolve();
            });
        })
        .catch((error) => {
          console /*OK*/
            .error('Custom refresh size change failed:', error);
          // IMPORTANT: Uncomment these to prevent stuck refresh state
          this.isCustomRefreshing_ = false;
          this.isRefreshing = false;
          resolve();
        });
    });

    // Add timeout protection
    return Promise.race([
      refreshPromise,
      new Promise((resolve) => {
        this.timer_.delay(() => {
          console /*OK*/
            .error('Refresh timed out after 10 seconds');
          this.isCustomRefreshing_ = false;
          this.isRefreshing = false;
          resolve();
        }, 10000); // 10 second timeout
      }),
    ]);
  }

  /**
   * Pauses the custom refresh cycle
   */
  pauseCustomRefresh() {
    if (this.customRefreshTimerId_) {
      this.timer_.cancel(this.customRefreshTimerId_);
      this.customRefreshTimerId_ = null;
    }
    this.customRefreshEnabled_ = false;
  }

  /**
   * Resumes the custom refresh cycle
   */
  resumeCustomRefresh() {
    this.customRefreshEnabled_ = true;
    if (!this.isCustomRefreshing_ && !this.customRefreshTimerId_) {
      this.initiateCustomRefresh();
    }
  }

  /**
   * Updates the custom refresh interval
   * @param {number} intervalSeconds - New interval in seconds
   */
  setCustomRefreshInterval(intervalSeconds) {
    this.customRefreshInterval_ = intervalSeconds * 1000;
    // Restart refresh cycle with new interval
    if (this.customRefreshTimerId_) {
      this.timer_.cancel(this.customRefreshTimerId_);
      this.customRefreshTimerId_ = null;
    }
    this.initiateCustomRefresh();
  }
