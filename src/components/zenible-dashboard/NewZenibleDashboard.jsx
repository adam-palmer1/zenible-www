import React from 'react';
import NewSidebar from '../sidebar/NewSidebar';
import TipOfTheDay from '../TipOfTheDay';
import avatarImg from '../../assets/icons/dashboard/avatar.png';
import checkIcon from '../../assets/icons/dashboard/check.svg';
import mainIcon from '../../assets/icons/dashboard/icon.svg';
import flashIcon from '../../assets/icons/dashboard/flash.svg';
import trendDownIcon from '../../assets/icons/dashboard/trend-down.svg';
import trendArrow1 from '../../assets/icons/dashboard/trend-arrow-1.svg';
import trendArrow2 from '../../assets/icons/dashboard/trend-arrow-2.svg';
import progressDotIcon from '../../assets/icons/dashboard/progress-dot.svg';
import fire1 from '../../assets/icons/dashboard/fire-1.svg';
import fire2 from '../../assets/icons/dashboard/fire-2.svg';
import fire3 from '../../assets/icons/dashboard/fire-3.svg';
import chartIcon from '../../assets/icons/dashboard/chart.svg';
import quizIcon from '../../assets/icons/dashboard/quiz.svg';
import profileUserIcon from '../../assets/icons/dashboard/profile-2user.svg';
import bookIcon from '../../assets/icons/dashboard/book.svg';
import playIcon from '../../assets/icons/dashboard/play.svg';
import cupIcon1 from '../../assets/icons/dashboard/cup-1.svg';
import checkCircle1 from '../../assets/icons/dashboard/check-circle-1.svg';
import checkCircle2 from '../../assets/icons/dashboard/check-circle-2.svg';
import arrowRight1 from '../../assets/icons/dashboard/arrow-right-1.svg';
import arrowRight2 from '../../assets/icons/dashboard/arrow-right-2.svg';
import arrowRight3 from '../../assets/icons/dashboard/arrow-right-3.svg';

function Checkbox({ checked, onChange, className }) {
  if (checked) {
    return (
      <div className={className} onClick={onChange}>
        <div className="absolute inset-[12.5%]">
          <img alt="" className="block max-w-none size-full" src={checkIcon} />
        </div>
      </div>
    );
  }
  return <div className={className} onClick={onChange} />;
}

export default function NewZenibleDashboard() {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <NewSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-[280px] content-stretch flex flex-col items-start relative size-full">
        {/* Welcome Header */}
        <div className="box-border content-stretch flex flex-col gap-[4px] items-start not-italic p-[16px] relative shrink-0 text-nowrap w-full whitespace-pre">
          <p className="font-['Inter'] font-semibold leading-[32px] relative shrink-0 text-[24px] text-zinc-950">
            Welcome back, Lia! 👋
          </p>
          <p className="font-['Inter'] font-normal leading-[22px] relative shrink-0 text-[14px] text-zinc-500">
            Let's make today count. You're on a 7-day streak!
          </p>
        </div>

        {/* Profile Setup Card */}
        <div className="box-border content-stretch flex gap-[14px] items-center px-[16px] py-[8px] relative shrink-0 w-full">
          <div className="basis-0 bg-violet-50 border border-[#c4b4ff] border-solid box-border content-stretch flex flex-col gap-[22px] grow items-start min-h-px min-w-px p-[16px] relative rounded-[12px] shrink-0">
            <div className="content-stretch flex gap-[16px] items-center relative shrink-0 w-full">
              <div className="bg-white box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[46px]">
                <div className="relative shrink-0 size-[24px]">
                  <img alt="" className="block max-w-none size-full" src={mainIcon} />
                </div>
              </div>
              <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px not-italic relative shrink-0 text-nowrap">
                <div className="flex flex-col font-['Inter'] font-semibold justify-center leading-[0] relative shrink-0 text-[18px] text-zinc-950">
                  <p className="leading-[26px] text-nowrap whitespace-pre">Personalize Your AI Experience</p>
                </div>
                <p className="font-['Inter'] font-normal leading-[20px] relative shrink-0 text-[12px] text-zinc-500 whitespace-pre">
                  Complete your professional profile to get more relevant and tailored proposal feedback.
                </p>
              </div>
              <div className="bg-[#8e51ff] box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center overflow-clip px-[12px] py-[10px] relative rounded-[10px] shrink-0">
                <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-white whitespace-pre">
                  Setup Profile
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tip of the Day Card */}
        <div className="box-border content-stretch flex gap-[14px] items-start pb-[16px] pt-[8px] px-[16px] relative shrink-0 w-full">
          <TipOfTheDay />
        </div>

        {/* Stats Cards Row */}
        <div className="box-border content-stretch flex gap-[14px] items-center px-[16px] py-[8px] relative shrink-0 w-full">
          {/* Zenible Score Card */}
          <div className="basis-0 border border-[#c4b4ff] border-solid box-border content-stretch flex flex-col gap-[16px] grow items-start min-h-px min-w-px p-[17px] relative rounded-[12px] shrink-0">
            <div className="h-[20px] relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[20px] items-center justify-between relative w-full">
                <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-950">
                  <p className="leading-[24px] whitespace-pre">Zenible Score</p>
                </div>
                <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                  <div className="relative shrink-0 size-[16px]">
                    <div className="absolute contents left-0 top-0">
                      <img alt="" className="block max-w-none size-full" src={flashIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[16px] items-start relative w-full">
                <div className="content-stretch flex flex-col gap-[2px] items-center justify-center relative shrink-0 w-full">
                  <div className="flex flex-col font-['Inter'] font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#8e51ff] text-[48px] text-nowrap">
                    <p className="leading-[56px] whitespace-pre">847</p>
                  </div>
                  <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                    <div className="overflow-clip relative shrink-0 size-[16px]">
                      <div className="absolute inset-0">
                        <img alt="" className="block max-w-none size-full" src={trendDownIcon} />
                      </div>
                      <div className="absolute bottom-1/4 left-[9.38%] right-[9.38%] top-1/4">
                        <div className="absolute inset-[-6.25%_-3.85%]">
                          <img alt="" className="block max-w-none size-full" src={trendArrow1} />
                        </div>
                      </div>
                      <div className="absolute bottom-1/4 left-[65.63%] right-[9.38%] top-1/2">
                        <div className="absolute inset-[-12.5%]">
                          <img alt="" className="block max-w-none size-full" src={trendArrow2} />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col font-['Inter'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-[#00a63e] text-[12px] text-nowrap">
                      <p className="leading-[20px] whitespace-pre">+24 this week</p>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full">
                  <div className="bg-white box-border content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[8px] relative rounded-[8px] shrink-0 w-full">
                    <div className="content-stretch flex font-['Inter'] font-normal items-start justify-between leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap text-zinc-500 w-full whitespace-pre">
                      <p className="relative shrink-0">Novice</p>
                      <p className="relative shrink-0">Expert</p>
                    </div>
                    <div className="bg-neutral-200 box-border content-stretch flex flex-col gap-[10px] h-[10px] items-start overflow-clip pl-0 pr-[80px] py-0 relative rounded-[60px] shrink-0 w-full">
                      <div className="basis-0 bg-[#8e51ff] box-border content-stretch flex grow items-center justify-end min-h-px min-w-px overflow-clip p-[2px] relative rounded-[40px] shrink-0 w-full">
                        <div className="relative shrink-0 size-[6px]">
                          <img alt="" className="block max-w-none size-full" src={progressDotIcon} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="font-['Inter'] font-normal leading-[20px] not-italic relative shrink-0 text-[12px] text-center text-zinc-950 w-full">
                    Keep analyzing proposals to increase your score
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Streak Card */}
          <div className="basis-0 bg-white border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[16px] grow h-[246px] items-center min-h-px min-w-px p-[17px] relative rounded-[12px] shrink-0">
            <div className="h-[20px] relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[20px] items-center justify-between relative w-full">
                <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-500">
                  <p className="leading-[24px] whitespace-pre">Streak</p>
                </div>
                <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                  <div className="overflow-clip relative shrink-0 size-[16px]">
                    <div className="absolute inset-0">
                      <img alt="" className="block max-w-none size-full" src={fire1} />
                    </div>
                    <div className="absolute bottom-1/4 left-[53.13%] right-[31.25%] top-[59.38%]">
                      <div className="absolute inset-[-20.003%]">
                        <img alt="" className="block max-w-none size-full" src={fire2} />
                      </div>
                    </div>
                    <div className="absolute inset-[9.38%_18.75%_12.5%_18.75%]">
                      <div className="absolute inset-[-4%_-5%]">
                        <img alt="" className="block max-w-none size-full" src={fire3} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[16px] items-center relative size-full">
                <div className="content-stretch flex gap-[16px] items-center relative shrink-0">
                  <div className="opacity-30 relative shrink-0 size-[56px]">
                    <p className="absolute font-['Arial'] leading-[36px] left-[calc(50%-15px)] not-italic text-[#1a1a1a] text-[30px] text-nowrap top-[calc(50%-18px)] whitespace-pre">
                      💨
                    </p>
                  </div>
                  <div className="opacity-30 relative shrink-0 size-[56px]">
                    <p className="absolute font-['Arial'] leading-[40px] left-[calc(50%-18px)] not-italic text-[#1a1a1a] text-[36px] text-nowrap top-[calc(50%-20px)] whitespace-pre">
                      🔥
                    </p>
                  </div>
                  <div className="relative shrink-0 size-[56px]">
                    <p className="absolute font-['Arial'] leading-[48px] left-[calc(50%-24px)] not-italic text-[#1a1a1a] text-[48px] text-nowrap top-[calc(50%-24px)] whitespace-pre">
                      🔥
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex flex-col items-center justify-center leading-[0] not-italic relative shrink-0 text-nowrap w-full">
                  <div className="flex flex-col font-['Inter'] font-bold justify-center relative shrink-0 text-[#fb2c36] text-[48px]">
                    <p className="leading-[56px] text-nowrap whitespace-pre">7</p>
                  </div>
                  <div className="flex flex-col font-['Inter'] font-normal justify-center relative shrink-0 text-[12px] text-zinc-400">
                    <p className="leading-[20px] text-nowrap whitespace-pre">days in a row</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="font-['Inter'] font-normal leading-[20px] not-italic relative shrink-0 text-[12px] text-center text-nowrap text-zinc-950 whitespace-pre">
              <span>Longest: </span>
              <span className="text-[#8e51ff]">14 days</span>
            </p>
          </div>

          {/* Today's Goals Card */}
          <div className="basis-0 bg-white border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[16px] grow h-[246px] items-start min-h-px min-w-px p-[17px] relative rounded-[12px] shrink-0">
            <div className="h-[20px] relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex h-[20px] items-center justify-between relative w-full">
                <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-500">
                  <p className="leading-[24px] whitespace-pre">Today's Goals</p>
                </div>
                <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                  <div className="relative shrink-0 size-[16px]">
                    <div className="absolute contents inset-0">
                      <img alt="" className="block max-w-none size-full" src={chartIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-neutral-200 border-solid relative rounded-[8px] shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[8px] items-start overflow-clip p-[8px] relative rounded-[inherit] w-full">
                <div className="content-stretch flex font-['Inter'] font-normal items-start justify-between leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap w-full whitespace-pre">
                  <p className="relative shrink-0 text-zinc-950">Progress</p>
                  <p className="relative shrink-0 text-zinc-500">2/3</p>
                </div>
                <div className="bg-neutral-200 box-border content-stretch flex flex-col gap-[10px] h-[10px] items-start overflow-clip pl-0 pr-[80px] py-0 relative rounded-[60px] shrink-0 w-full">
                  <div className="basis-0 bg-[#8e51ff] box-border content-stretch flex grow items-center justify-end min-h-px min-w-px overflow-clip p-[2px] relative rounded-[40px] shrink-0 w-full">
                    <div className="relative shrink-0 size-[6px]">
                      <img alt="" className="block max-w-none size-full" src={progressDotIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="basis-0 grow min-h-px min-w-px relative shrink-0 w-full">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid box-border content-stretch flex flex-col gap-[12px] items-start relative size-full">
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="box-border content-stretch flex items-center justify-center pb-0 pt-[2px] px-0 relative shrink-0">
                      <Checkbox
                        checked={true}
                        className="bg-[#8e51ff] overflow-clip relative rounded-[4px] shrink-0 size-[16px] cursor-pointer"
                      />
                    </div>
                    <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] basis-0 decoration-solid font-['Inter'] font-normal grow leading-[22px] line-through min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-zinc-500">
                      Complete one proposal analysis
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="box-border content-stretch flex items-center justify-center pb-0 pt-[2px] px-0 relative shrink-0">
                      <Checkbox
                        checked={true}
                        className="bg-[#8e51ff] overflow-clip relative rounded-[4px] shrink-0 size-[16px] cursor-pointer"
                      />
                    </div>
                    <p className="[text-decoration-skip-ink:none] [text-underline-position:from-font] basis-0 decoration-solid font-['Inter'] font-normal grow leading-[22px] line-through min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-zinc-500">
                      Review AI feedback from yesterday
                    </p>
                  </div>
                </div>
                <div className="content-stretch flex items-center relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="box-border content-stretch flex items-center justify-center pb-0 pt-[2px] px-0 relative shrink-0">
                      <Checkbox
                        checked={false}
                        className="border border-neutral-200 border-solid rounded-[4px] shrink-0 size-[16px] cursor-pointer"
                      />
                    </div>
                    <p className="basis-0 font-['Inter'] font-normal grow leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-zinc-950">
                      Watch one Business School lesson
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz and Accountability Partner Row */}
        <div className="box-border content-stretch flex gap-[14px] items-center px-[16px] py-[8px] relative shrink-0 w-full">
          {/* Today's Quiz Card */}
          <div className="basis-0 bg-white border border-neutral-200 border-solid content-stretch flex flex-col grow items-start min-h-px min-w-px relative rounded-[12px] shrink-0">
            <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
              <p className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
                Today's Quiz
              </p>
              <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute contents inset-0">
                    <img alt="" className="block max-w-none size-full" src={quizIcon} />
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex flex-col gap-[8px] items-start justify-end p-[16px] relative shrink-0 w-full">
              <div className="flex flex-col font-['Inter'] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#1a1a1a] text-[14px] text-nowrap">
                <p className="leading-[22px] whitespace-pre">What's the most important element in a winning proposal?</p>
              </div>
              <div className="content-stretch flex flex-col gap-[16px] items-start justify-center relative shrink-0 w-full">
                <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="bg-white border-[1.5px] border-neutral-200 border-solid relative rounded-[10px] shrink-0 w-full">
                      <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[inherit] w-full">
                        <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                          <p className="basis-0 font-['Inter'] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-zinc-950">
                            Competitive pricing
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="bg-white border-[1.5px] border-neutral-200 border-solid relative rounded-[10px] shrink-0 w-full">
                      <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[inherit] w-full">
                        <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                          <p className="basis-0 font-['Inter'] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-zinc-950">
                            Clear value proposition
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="bg-white border-[1.5px] border-neutral-200 border-solid relative rounded-[10px] shrink-0 w-full">
                      <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[inherit] w-full">
                        <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                          <p className="basis-0 font-['Inter'] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-zinc-950">
                            Quick turnaround time
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="basis-0 content-stretch flex flex-col gap-[8px] grow items-start min-h-px min-w-px relative shrink-0">
                    <div className="bg-white border-[1.5px] border-neutral-200 border-solid relative rounded-[10px] shrink-0 w-full">
                      <div className="box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[inherit] w-full">
                        <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                          <p className="basis-0 font-['Inter'] font-normal grow leading-[24px] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-center text-zinc-950">
                            Portfolio examples
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Accountability Partner Card */}
          <div className="bg-white border border-neutral-200 border-solid content-stretch flex flex-col items-start relative rounded-[12px] shrink-0 w-[366.667px]">
            <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
              <p className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
                Accountability Partner
              </p>
              <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute contents inset-0">
                    <img alt="" className="block max-w-none size-full" src={profileUserIcon} />
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex flex-col gap-[8px] items-center pb-[16px] pt-[8px] px-[16px] relative shrink-0 w-full">
              <div className="content-stretch flex gap-[12px] items-center relative rounded-[8px] shrink-0 w-[334.667px]">
                <div className="relative rounded-[22.909px] shrink-0 size-[42px]">
                  <img alt="" className="absolute inset-0 max-w-none object-50%-50% object-cover pointer-events-none rounded-[22.909px] size-full" src={avatarImg} />
                </div>
                <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px not-italic relative shrink-0">
                  <p className="font-['Inter'] font-medium leading-[22px] relative shrink-0 text-[14px] text-zinc-950 w-full">
                    Sarah Chen
                  </p>
                  <p className="font-['Inter'] font-normal leading-[20px] relative shrink-0 text-[12px] text-zinc-500 w-full">
                    Last check-in 2 hours ago
                  </p>
                </div>
                <div className="bg-[#00c950] rounded-[3.35544e+07px] shrink-0 size-[8px]" />
              </div>
              <div className="bg-zinc-100 box-border content-stretch flex gap-[12px] items-center overflow-clip px-[16px] py-[14px] relative rounded-[10px] shrink-0 w-full">
                <div className="basis-0 box-border content-stretch flex grow h-[20px] items-center justify-center min-h-px min-w-px pb-0 pt-[2px] px-0 relative shrink-0">
                  <p className="basis-0 font-['Inter'] font-normal grow leading-[22px] min-h-px min-w-px not-italic relative shrink-0 text-[14px] text-center text-zinc-500">
                    Completed 3 proposals this week
                  </p>
                </div>
              </div>
              <div className="border border-solid border-zinc-400 h-[40px] relative rounded-[10px] shrink-0 w-full">
                <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center overflow-clip px-[12px] py-[10px] relative rounded-[inherit] w-full">
                  <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-950 whitespace-pre">
                    Send Check-in
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Continue Learning and Recent Wins */}
        <div className="box-border content-stretch flex gap-[14px] items-start px-[16px] py-[8px] relative shrink-0 w-full">
          {/* Continue Learning Card */}
          <div className="basis-0 bg-white border border-neutral-200 border-solid content-stretch flex flex-col grow items-start min-h-px min-w-px relative rounded-[12px] shrink-0">
            <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
              <p className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
                Continue Learning
              </p>
              <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <img alt="" className="block max-w-none size-full" src={bookIcon} />
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex flex-col gap-[8px] items-center pb-0 pt-[8px] px-[16px] relative shrink-0 w-full">
              <div className="bg-violet-50 content-stretch flex flex-col h-[186px] items-center justify-center overflow-clip relative rounded-[12px] shrink-0 w-full">
                <div className="bg-[#8e51ff] box-border content-stretch flex gap-[8px] items-center justify-center overflow-clip px-[12px] py-[10px] relative rounded-[40px] shrink-0 size-[40px]">
                  <div className="relative shrink-0 size-[20px]">
                    <div className="absolute contents inset-0">
                      <img alt="" className="block max-w-none size-full" src={playIcon} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex flex-col gap-[8px] items-start p-[16px] relative shrink-0 w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
                <div className="basis-0 flex flex-col font-['Inter'] font-medium grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[16px] text-zinc-950">
                  <p className="leading-[24px]">Advanced Pricing Strategies</p>
                </div>
              </div>
              <div className="border border-neutral-200 border-solid relative rounded-[8px] shrink-0 w-full">
                <div className="box-border content-stretch flex flex-col gap-[8px] items-start overflow-clip px-[12px] py-[8px] relative rounded-[inherit] w-full">
                  <div className="content-stretch flex font-['Inter'] font-normal gap-[8px] items-start leading-[22px] not-italic relative shrink-0 text-[14px] w-full">
                    <p className="basis-0 grow min-h-px min-w-px relative shrink-0 text-zinc-950">
                      Progress
                    </p>
                    <p className="relative shrink-0 text-[#8e51ff] text-nowrap whitespace-pre">
                      73%
                    </p>
                  </div>
                  <div className="bg-neutral-50 box-border content-stretch flex flex-col gap-[10px] h-[10px] items-start overflow-clip pl-0 pr-[80px] py-0 relative rounded-[60px] shrink-0 w-full">
                    <div className="basis-0 bg-[#8e51ff] box-border content-stretch flex grow items-center justify-end min-h-px min-w-px overflow-clip p-[2px] relative rounded-[40px] shrink-0 w-full">
                      <div className="relative shrink-0 size-[6px]">
                        <img alt="" className="block max-w-none size-full" src={progressDotIcon} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex gap-[12px] items-start justify-center pb-[16px] pt-[8px] px-[16px] relative shrink-0 w-full">
              <div className="basis-0 border border-solid border-zinc-400 grow h-[40px] min-h-px min-w-px relative rounded-[10px] shrink-0">
                <div className="box-border content-stretch flex gap-[8px] h-[40px] items-center justify-center overflow-clip px-[12px] py-[10px] relative rounded-[inherit] w-full">
                  <p className="font-['Inter'] font-medium leading-[24px] not-italic relative shrink-0 text-[16px] text-nowrap text-zinc-950 whitespace-pre">
                    Resume Lesson
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Wins Card */}
          <div className="basis-0 bg-white border border-neutral-200 border-solid content-stretch flex flex-col grow items-start min-h-px min-w-px relative rounded-[12px] self-stretch shrink-0">
            <div className="box-border content-stretch flex gap-[8px] items-center p-[16px] relative shrink-0 w-full">
              <p className="basis-0 font-['Inter'] font-semibold grow leading-[26px] min-h-px min-w-px not-italic relative shrink-0 text-[18px] text-zinc-950">
                Recent Wins
              </p>
              <div className="bg-neutral-50 box-border content-stretch flex gap-[8px] items-center justify-center p-[8px] relative rounded-[8px] shrink-0 size-[28px]">
                <div className="relative shrink-0 size-[16px]">
                  <div className="absolute contents inset-0">
                    <img alt="" className="block max-w-none size-full" src={cupIcon1} />
                  </div>
                </div>
              </div>
            </div>
            <div className="basis-0 box-border content-stretch flex flex-col gap-[8px] grow items-center min-h-px min-w-px pb-[16px] pt-[8px] px-[16px] relative shrink-0 w-full">
              <div className="bg-white border border-neutral-200 border-solid box-border content-stretch flex gap-[16px] items-start p-[16px] relative rounded-[12px] shrink-0 w-full">
                <div className="bg-green-100 overflow-clip relative rounded-[46.667px] shrink-0 size-[42px]">
                  <div className="absolute inset-[26.19%] overflow-clip">
                    <div className="absolute inset-[40.63%_34.38%_37.5%_34.38%]">
                      <div className="absolute inset-[-19.05%_-13.33%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle1} />
                      </div>
                    </div>
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-5.556%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle2} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                  <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-950 w-full">
                    E-commerce Website
                  </p>
                  <div className="content-stretch flex gap-[8px] items-center leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap w-full whitespace-pre">
                    <p className="font-['Inter'] font-medium relative shrink-0 text-[#00a63e]">
                      +18 points
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-400">
                      •
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-500">
                      2 hours ago
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 border-solid box-border content-stretch flex gap-[16px] items-start p-[16px] relative rounded-[12px] shrink-0 w-full">
                <div className="bg-green-100 overflow-clip relative rounded-[46.667px] shrink-0 size-[42px]">
                  <div className="absolute inset-[26.19%] overflow-clip">
                    <div className="absolute inset-[40.63%_34.38%_37.5%_34.38%]">
                      <div className="absolute inset-[-19.05%_-13.33%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle1} />
                      </div>
                    </div>
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-5.556%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle2} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                  <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-950 w-full">
                    Mobile App Design
                  </p>
                  <div className="content-stretch flex gap-[8px] items-center leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap w-full whitespace-pre">
                    <p className="font-['Inter'] font-medium relative shrink-0 text-[#00a63e]">
                      +12 points
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-400">
                      •
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-500">
                      Yesterday
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-neutral-200 border-solid box-border content-stretch flex gap-[16px] items-start p-[16px] relative rounded-[12px] shrink-0 w-full">
                <div className="bg-green-100 overflow-clip relative rounded-[46.667px] shrink-0 size-[42px]">
                  <div className="absolute inset-[26.19%] overflow-clip">
                    <div className="absolute inset-[40.63%_34.38%_37.5%_34.38%]">
                      <div className="absolute inset-[-19.05%_-13.33%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle1} />
                      </div>
                    </div>
                    <div className="absolute inset-[12.5%]">
                      <div className="absolute inset-[-5.556%]">
                        <img alt="" className="block max-w-none size-full" src={checkCircle2} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="basis-0 content-stretch flex flex-col grow items-start min-h-px min-w-px relative shrink-0">
                  <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[14px] text-zinc-950 w-full">
                    Brand Strategy
                  </p>
                  <div className="content-stretch flex gap-[8px] items-center leading-[20px] not-italic relative shrink-0 text-[12px] text-nowrap w-full whitespace-pre">
                    <p className="font-['Inter'] font-medium relative shrink-0 text-[#00a63e]">
                      +25 points
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-400">
                      •
                    </p>
                    <p className="font-['Inter'] font-normal relative shrink-0 text-zinc-500">
                      2 days ago
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="box-border content-stretch flex gap-[12px] items-start justify-center pb-[16px] pt-[8px] px-[16px] relative shrink-0 w-full">
              <div className="box-border content-stretch flex gap-[4px] h-[36px] items-center justify-center overflow-clip px-[12px] py-[8px] relative rounded-[10px] shrink-0">
                <p className="font-['Inter'] font-medium leading-[22px] not-italic relative shrink-0 text-[#8e51ff] text-[14px] text-nowrap whitespace-pre">
                  Analyze Another Proposal
                </p>
                <div className="overflow-clip relative shrink-0 size-[16px]">
                  <div className="absolute inset-0">
                    <img alt="" className="block max-w-none size-full" src={arrowRight1} />
                  </div>
                  <div className="absolute bottom-1/2 left-[15.63%] right-[15.63%] top-1/2">
                    <div className="absolute inset-[-0.75px_-6.82%]">
                      <img alt="" className="block max-w-none size-full" src={arrowRight2} />
                    </div>
                  </div>
                  <div className="absolute inset-[21.88%_15.63%_21.88%_56.25%]">
                    <div className="absolute inset-[-8.33%_-16.67%]">
                      <img alt="" className="block max-w-none size-full" src={arrowRight3} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}