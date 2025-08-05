# Always Serve NPA

`always-serve-npa` provides a way to utilize the `<amp-geo>` component to detect user's geo location to decide if a non-personalized ad should be requested, regardless of the [user's consent decision](amp-consent.md). The value of `always-serve-npa` should be a comma delimited string of geo group codes which are defined in `<amp-geo>` (details [here](https://github.com/ampproject/amphtml/blob/main/extensions/amp-geo/amp-geo.md)). If no value is found or an empty string is provided, then a NPA will always be requested, regardless of the location.

```html
<amp-ad
  width="320"
  height="50"
  data-public-id="4WMPI6PV"
  always-serve-npa="geoGroup1,geoGroup2"
  type="insurads"
  data-slot="/134642692/AMPTestsV3"
>
</amp-ad>

<amp-geo>
  <script type="application/json">
    {
      "ISOCountryGroups": {
        "geoGroup1": [ "preset-eea", "unknown" ],
        "geoGroup2": [ "preset-us-ca" ]
      }
    }
  </script>
</amp-geo>
```
