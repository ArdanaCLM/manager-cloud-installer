describe('basic sanity tests', function() {

  beforeAll(function(){
    browser.get('localhost:3000');
    browser.sleep(1000);
  });

  it('loads the app', function() {
     expect(browser.getTitle()).toEqual('SUSE OpenStack Cloud Installer');
  });

  it('has the first step selected by default', function() {
    var stateLineWrapperContainer = element(by.css('.stateLineWrapper'));
    var firstIndicator = stateLineWrapperContainer.all(by.css('.progress')).first();

    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(2, 164, 156, 1)');//the rgba value of #02A49C
  });

  it('advances to the next page and updates the indicator', function() {
    var stateLineWrapperContainer = element(by.css('.stateLineWrapper'));
    var firstIndicator = stateLineWrapperContainer.all(by.css('.progress')).first();
    var lastIndicator = stateLineWrapperContainer.all(by.css('.progress')).last();

    //the first indicator is the correct "in-progress" color
    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(2, 164, 156, 1)');//the rgba value of #02A49C

    var nextButton = element(by.xpath('.//*[.="Next"]'));
    nextButton.click();
    //the first indicator has updated to the "complete" color
    expect(firstIndicator.getCssValue('background-color')).toEqual('rgba(0, 192, 129, 1)');//the rgba value of #00C081
    //the last indicator has a "notdone" color
    expect(lastIndicator.getCssValue('background-color')).toEqual('rgba(220, 221, 222, 1)');//the rgba value of #DCDDDE
  });
});
