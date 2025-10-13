import React, { useState } from 'react';

const KeyTakeaways = ({ lesson }) => {
  const [completedTakeaways, setCompletedTakeaways] = useState(new Set());

  // Mock takeaways data - would come from backend
  const takeawaysData = {
    1: {
      title: "Introduction to Freelancing",
      takeaways: [
        {
          id: 1,
          text: "Freelancing is running your own business, not just providing services",
          type: "concept",
          priority: "high"
        },
        {
          id: 2,
          text: "Flexibility comes with the responsibility of self-management",
          type: "insight",
          priority: "high"
        },
        {
          id: 3,
          text: "Traditional employee benefits don't apply - plan accordingly",
          type: "warning",
          priority: "medium"
        },
        {
          id: 4,
          text: "Diverse client base reduces dependency on single income source",
          type: "strategy",
          priority: "medium"
        },
        {
          id: 5,
          text: "Mindset shift is crucial for freelancing success",
          type: "concept",
          priority: "high"
        }
      ],
      resources: [
        { title: "Freelancer Tax Guide", url: "#", type: "pdf" },
        { title: "Business Structure Comparison", url: "#", type: "article" }
      ]
    },
    2: {
      title: "Setting Up Your Profile",
      takeaways: [
        {
          id: 1,
          text: "Your profile is your first impression - make it count",
          type: "insight",
          priority: "high"
        },
        {
          id: 2,
          text: "Include a compelling headline that speaks to client needs",
          type: "strategy",
          priority: "high"
        },
        {
          id: 3,
          text: "Portfolio should showcase your best work, not everything",
          type: "strategy",
          priority: "medium"
        },
        {
          id: 4,
          text: "Client testimonials build credibility and trust",
          type: "concept",
          priority: "high"
        }
      ],
      resources: [
        { title: "Profile Optimization Checklist", url: "#", type: "checklist" },
        { title: "Portfolio Examples", url: "#", type: "gallery" }
      ]
    }
  };

  const currentTakeaways = takeawaysData[lesson?.id];

  const toggleTakeawayComplete = (takeawayId) => {
    const newCompleted = new Set(completedTakeaways);
    if (newCompleted.has(takeawayId)) {
      newCompleted.delete(takeawayId);
    } else {
      newCompleted.add(takeawayId);
    }
    setCompletedTakeaways(newCompleted);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'concept':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'strategy':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
          </svg>
        );
      case 'insight':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (!lesson || !currentTakeaways) {
    return (
      <div className="p-6 text-center text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4z" clipRule="evenodd" />
        </svg>
        <p>Select a lesson to view key takeaways</p>
      </div>
    );
  }

  const completionRate = (completedTakeaways.size / currentTakeaways.takeaways.length) * 100;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Takeaways</h3>
        <p className="text-sm text-gray-600 mb-3">{currentTakeaways.title}</p>

        {/* Progress */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">
            {completedTakeaways.size}/{currentTakeaways.takeaways.length}
          </span>
        </div>
      </div>

      {/* Takeaways List */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {currentTakeaways.takeaways.map((takeaway) => {
            const isCompleted = completedTakeaways.has(takeaway.id);
            return (
              <div
                key={takeaway.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => toggleTakeawayComplete(takeaway.id)}
              >
                <div className="flex items-start space-x-3">
                  {/* Checkbox */}
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-green-400'
                    }`}>
                      {isCompleted && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${
                        getPriorityColor(takeaway.priority)
                      }`}>
                        {getTypeIcon(takeaway.type)}
                        <span className="capitalize">{takeaway.type}</span>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        takeaway.priority === 'high' ? 'bg-red-100 text-red-700' :
                        takeaway.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {takeaway.priority} priority
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      isCompleted ? 'text-green-900 line-through' : 'text-gray-700'
                    }`}>
                      {takeaway.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resources Section */}
      {currentTakeaways.resources && currentTakeaways.resources.length > 0 && (
        <div className="border-t border-gray-200 p-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Resources</h4>
          <div className="space-y-2">
            {currentTakeaways.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                </svg>
                <span>{resource.title}</span>
                <span className="text-xs text-gray-500">({resource.type})</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyTakeaways;