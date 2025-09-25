import React from 'react';
import arrowLeft from '../assets/icons/arrow-left.svg';
import arrowRight from '../assets/icons/arrow-right.svg';
import arrowLeftSmall from '../assets/icons/arrow-left-small.svg';
import arrowRightSmall from '../assets/icons/arrow-right-small.svg';
import arrowWhiteLeft from '../assets/icons/arrow-white-left.svg';
import arrowWhiteRight from '../assets/icons/arrow-white-right.svg';
import tickSquare from '../assets/icons/tick-square.svg';
import dividerLine1 from '../assets/icons/divider-line1.svg';
import dividerLine2 from '../assets/icons/divider-line2.svg';

function Button({ rhsIcon = null, lhsIcon = null, showLhsIcon = true, showText = true, writeText = "Button Text", showRhsIcon = true, type = "Primary", size = "Large" }) {
  if (type === "Stroke" && size === "Large") {
    return (
      <div className="relative rounded-[12px] size-full" data-name="Type=Stroke, Size=Large">
        <div className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative size-full">
          {showLhsIcon &&
            (lhsIcon || (
              <div className="relative shrink-0 size-[24px]" data-name="Previous">
                <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
                  <div className="flex-none h-[4.811px] rotate-[90deg] w-[11px]">
                    <div className="relative size-full">
                      <div className="absolute inset-[-15.59%_-6.82%]">
                        <img alt="" className="block max-w-none size-full" src={arrowLeft} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {showText && (
            <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#ededf0]">
              <p className="leading-[24px] whitespace-pre">{writeText}</p>
            </div>
          )}
          {showRhsIcon &&
            (rhsIcon || (
              <div className="relative shrink-0 size-[24px]" data-name="Next">
                <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
                  <div className="flex-none h-[4.811px] rotate-[270deg] w-[11px]">
                    <div className="relative size-full">
                      <div className="absolute inset-[-15.59%_-6.82%]">
                        <img alt="" className="block max-w-none size-full" src={arrowRight} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div aria-hidden="true" className="absolute border border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[12px]" />
      </div>
    );
  }
  if (type === "Stroke" && size === "Small") {
    return (
      <div className="relative rounded-[10px] size-full" data-name="Type=Stroke, Size=Small">
        <div className="box-border content-stretch flex gap-[4px] items-center justify-center overflow-clip px-[12px] py-[8px] relative size-full">
          {showLhsIcon &&
            (lhsIcon || (
              <div className="relative shrink-0 size-[16px]" data-name="Previous">
                <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
                  <div className="flex-none h-[4.811px] rotate-[90deg] w-[11px]">
                    <div className="relative size-full">
                      <div className="absolute inset-[-23.38%_-10.23%]">
                        <img alt="" className="block max-w-none size-full" src={arrowLeftSmall} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          {showText && (
            <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[14px] text-nowrap text-[#ededf0]">
              <p className="leading-[22px] whitespace-pre">{writeText}</p>
            </div>
          )}
          {showRhsIcon &&
            (rhsIcon || (
              <div className="relative shrink-0 size-[16px]" data-name="Next">
                <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
                  <div className="flex-none h-[4.811px] rotate-[270deg] w-[11px]">
                    <div className="relative size-full">
                      <div className="absolute inset-[-23.38%_-10.23%]">
                        <img alt="" className="block max-w-none size-full" src={arrowRightSmall} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div aria-hidden="true" className="absolute border border-solid border-[#1f242f] inset-0 pointer-events-none rounded-[10px]" />
      </div>
    );
  }
  return (
    <div className="box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[12px] size-full" data-name="Type=Primary, Size=Large">
      {showLhsIcon &&
        (lhsIcon || (
          <div className="relative shrink-0 size-[24px]" data-name="Previous">
            <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
              <div className="flex-none h-[4.811px] rotate-[90deg] w-[11px]">
                <div className="relative size-full">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={arrowWhiteLeft} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      {showText && (
        <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-white">
          <p className="leading-[24px] whitespace-pre">{writeText}</p>
        </div>
      )}
      {showRhsIcon &&
        (rhsIcon || (
          <div className="relative shrink-0 size-[24px]" data-name="Next">
            <div className="absolute flex inset-[27.08%_39.98%] items-center justify-center">
              <div className="flex-none h-[4.811px] rotate-[270deg] w-[11px]">
                <div className="relative size-full">
                  <div className="absolute inset-[-15.59%_-6.82%]">
                    <img alt="" className="block max-w-none size-full" src={arrowWhiteRight} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}

export default function Plans() {
  return (
    <div className="bg-[#0c111d] content-stretch flex items-start relative size-full" data-name="Pricing page">
      <div className="basis-0 content-stretch flex flex-col grow h-full items-start min-h-px min-w-px relative shrink-0" data-name="RHS">
        {/* Top Bar */}
        <div className="h-[64px] relative shrink-0 w-full" data-name="Section - Top Bar">
          <div className="box-border content-stretch flex gap-[16px] h-[64px] items-center overflow-clip px-[16px] py-[10px] relative w-full">
            <div className="bg-[#161b26] relative rounded-[10px] shrink-0 size-[36px]" data-name="Button">
              <Button showText={false} writeText="Current Plan" showRhsIcon={false} type="Stroke" size="Small" />
            </div>
            <div className="basis-0 font-['Inter:SemiBold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px relative shrink-0 text-[24px] text-[#ededf0]">
              <p className="leading-[32px]">Pricing</p>
            </div>
          </div>
          <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-[#1f242f] border-solid inset-0 pointer-events-none" />
        </div>

        {/* Page Header */}
        <div className="box-border content-stretch flex items-center overflow-clip px-[156px] py-[16px] relative shrink-0 w-full" data-name="Page Header">
          <div className="basis-0 font-['Inter:SemiBold',_sans-serif] font-semibold grow leading-[0] min-h-px min-w-px relative shrink-0 text-[18px] text-[#ededf0]">
            <p className="leading-[26px]">Upgrade to unleash everything</p>
          </div>
          <div className="bg-[#161b26] content-stretch flex gap-[2px] items-center relative rounded-[8px] shrink-0">
            <div aria-hidden="true" className="absolute border border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[8px]" />
            <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center justify-center overflow-clip px-[12px] py-[8px] relative rounded-[8px] shrink-0" data-name="Tab Button">
              <div className="font-['Inter:SemiBold',_sans-serif] font-semibold leading-[0] relative shrink-0 text-[14px] text-nowrap text-[#94969c]">
                <p className="leading-[22px] whitespace-pre">Monthly</p>
              </div>
            </div>
            <div className="bg-[#161b26] h-[36px] relative rounded-[8px] shrink-0" data-name="Tab Button">
              <div className="box-border content-stretch flex gap-[8px] h-[36px] items-center justify-center overflow-clip px-[12px] py-[8px] relative">
                <div className="font-['Inter:SemiBold',_sans-serif] font-semibold leading-[0] relative shrink-0 text-[14px] text-nowrap text-[#ededf0]">
                  <p className="leading-[22px] whitespace-pre">Annually</p>
                </div>
              </div>
              <div aria-hidden="true" className="absolute border border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]" />
            </div>
          </div>
        </div>

        {/* Content Section - Pricing Cards */}
        <div className="basis-0 box-border content-stretch flex gap-[14px] grow items-start justify-center min-h-px min-w-px pb-[16px] pt-0 px-[16px] relative shrink-0 w-full" data-name="Content Section">

          {/* Free Plan */}
          <div className="bg-[#161b26] box-border content-stretch flex flex-col gap-[24px] h-[586px] items-start p-[24px] relative rounded-[12px] shrink-0 w-[366.667px]" data-name="Free Plan">
            <div aria-hidden="true" className="absolute border border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />

            {/* Header */}
            <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="header">
              <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] relative shrink-0 w-full" data-name="title">
                <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[20px] text-[#ededf0] w-full">
                  <p className="leading-[28px]">Free</p>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[14px] text-[#94969c] w-full">
                  <p className="leading-[22px]">Perfect for getting started</p>
                </div>
              </div>

              {/* Price */}
              <div className="content-stretch flex gap-[12px] items-center leading-[0] relative shrink-0 text-nowrap w-full" data-name="price">
                <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[0px] text-[#85888e]">
                  <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid leading-[32px] line-through text-[24px] text-nowrap whitespace-pre">$8</p>
                </div>
                <div className="font-['Inter:Bold',_sans-serif] font-bold relative shrink-0 text-[32px] text-[#ededf0]">
                  <p className="leading-[40px] text-nowrap whitespace-pre">$5</p>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[16px] text-[#94969c]">
                  <p className="leading-[24px] text-nowrap whitespace-pre">/ month</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-0 relative shrink-0 w-full">
              <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]" style={{ "--stroke-0": "rgba(229, 229, 229, 1)" }}>
                <img alt="" className="block max-w-none size-full" src={dividerLine1} />
              </div>
            </div>

            {/* Button */}
            <div className="bg-[#161b26] relative rounded-[12px] shrink-0 w-full" data-name="Button">
              <Button showLhsIcon={false} writeText="Current Plan" showRhsIcon={false} type="Stroke" />
            </div>

            {/* Features */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="feature-list">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">5 proposal analyses per month</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Basic AI feedback</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Score breakdown</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Email support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pro Plan (Popular) */}
          <div className="bg-[#161b26] box-border content-stretch flex flex-col gap-[24px] h-[586px] items-start p-[24px] relative rounded-[12px] shrink-0 w-[366.667px]" data-name="Pro Plan">
            <div aria-hidden="true" className="absolute border border-[#8e51ff] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />

            {/* Header */}
            <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="header">
              <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="title">
                <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full" data-name="wrapper">
                  <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[20px] text-nowrap text-[#ededf0]">
                    <p className="leading-[28px] whitespace-pre">Pro</p>
                  </div>
                  <div className="bg-[#8e51ff] box-border content-stretch flex gap-[10px] items-center justify-center px-[8px] py-[2px] relative rounded-[6px] shrink-0">
                    <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
                      <p className="leading-[22px] whitespace-pre">Popular</p>
                    </div>
                  </div>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] relative shrink-0 text-[14px] text-[#94969c] w-full">
                  <p className="leading-[22px]">Perfect for professionals</p>
                </div>
              </div>

              {/* Price */}
              <div className="content-stretch flex gap-[12px] items-center leading-[0] relative shrink-0 text-nowrap w-full" data-name="price">
                <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[#c4b4ff] text-[0px]">
                  <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid leading-[32px] line-through text-[24px] text-nowrap text-zinc-500 whitespace-pre">$49</p>
                </div>
                <div className="font-['Inter:Bold',_sans-serif] font-bold relative shrink-0 text-[32px] text-[#ededf0]">
                  <p className="leading-[40px] text-nowrap whitespace-pre">$29</p>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[16px] text-[#94969c]">
                  <p className="leading-[24px] text-nowrap whitespace-pre">/ month</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-0 relative shrink-0 w-full">
              <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]" style={{ "--stroke-0": "rgba(229, 229, 229, 1)" }}>
                <img alt="" className="block max-w-none size-full" src={dividerLine1} />
              </div>
            </div>

            {/* Button */}
            <div className="bg-[#8e51ff] box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip p-[12px] relative rounded-[12px] shrink-0 w-full" data-name="Button">
              <Button writeText="Upgrade" showLhsIcon={false} showRhsIcon={false} />
            </div>

            {/* Features */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="feature-list">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Unlimited proposal analyses</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Advanced AI insights</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Win rate tracking</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Premium templates library</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Export & sharing</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Priority email support</p>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-[#161b26] box-border content-stretch flex flex-col gap-[24px] items-start p-[24px] relative rounded-[12px] shrink-0 w-[366.667px]" data-name="Enterprise Plan">
            <div aria-hidden="true" className="absolute border border-[#1f242f] border-solid inset-0 pointer-events-none rounded-[12px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]" />

            {/* Header */}
            <div className="content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-full" data-name="header">
              <div className="content-stretch flex flex-col gap-[8px] items-start leading-[0] relative shrink-0 w-full" data-name="title">
                <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[20px] text-[#ededf0] w-full">
                  <p className="leading-[28px]">Enterprise</p>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[14px] text-[#94969c] w-full">
                  <p className="leading-[22px]">Perfect for large teams</p>
                </div>
              </div>

              {/* Price */}
              <div className="content-stretch flex gap-[12px] items-center leading-[0] relative shrink-0 text-nowrap w-full" data-name="price">
                <div className="font-['Inter:Medium',_sans-serif] font-medium relative shrink-0 text-[0px] text-[#85888e]">
                  <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] decoration-solid leading-[32px] line-through text-[24px] text-nowrap whitespace-pre">$149</p>
                </div>
                <div className="font-['Inter:Bold',_sans-serif] font-bold relative shrink-0 text-[32px] text-[#ededf0]">
                  <p className="leading-[40px] text-nowrap whitespace-pre">$99</p>
                </div>
                <div className="font-['Inter:Regular',_sans-serif] font-normal relative shrink-0 text-[16px] text-[#94969c]">
                  <p className="leading-[24px] text-nowrap whitespace-pre">/ month</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-0 relative shrink-0 w-full">
              <div className="absolute bottom-[-0.5px] left-0 right-0 top-[-0.5px]" style={{ "--stroke-0": "rgba(229, 229, 229, 1)" }}>
                <img alt="" className="block max-w-none size-full" src={dividerLine2} />
              </div>
            </div>

            {/* Button */}
            <div className="bg-[#161b26] relative rounded-[12px] shrink-0 w-full" data-name="Button">
              <Button showLhsIcon={false} writeText="Upgrade" showRhsIcon={false} type="Stroke" />
            </div>

            {/* Features */}
            <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-full" data-name="feature-list">
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Everything in Pro</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Team collaboration (up to 10 users)</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Custom branding</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Advanced analytics</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">API access</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Dedicated account manager</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Phone & chat support</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[12px] items-center relative shrink-0 w-full" data-name="feature">
                <div className="relative shrink-0 size-[24px]" data-name="Tick Square">
                  <div className="absolute inset-[11.46%]">
                    <img alt="" className="block max-w-none size-full" src={tickSquare} />
                  </div>
                </div>
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[16px] text-nowrap text-[#94969c]">
                  <p className="leading-[24px] whitespace-pre">Custom integrations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}