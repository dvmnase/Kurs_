import { useEffect, useCallback } from 'react'
import { useStateContext } from '../utils/context/StateContext'
import Layout from '../components/Layout'
import {
  Intro,
  Selection,
  Partners,
  HotBid,
  Categories,
  Discover,
  Description,
} from '../screens/Home'
import chooseBySlug from '../utils/chooseBySlug'
import { getDataByCategory, getAllDataByType } from '../lib/cosmic'
import { authService } from '../services/authService'

const Home = ({
  reviews,
  landing,
  categoriesGroup,
  categoryTypes,
  navigationItems,
}) => {
  const { categories, onCategoriesChange, setNavigation } = useStateContext()
  const isAuthenticated = authService.isAuthenticated()
  const userRole = authService.getRole()

  const handleContextAdd = useCallback(
    (category, data, navigation) => {
      onCategoriesChange({ groups: category, type: data })
      setNavigation(navigation)
    },
    [onCategoriesChange, setNavigation]
  )

  useEffect(() => {
    let isMounted = true

    if (!categories['groups']?.length && isMounted) {
      const navigation = !userRole ? {
        menu: [
          {
            title: 'Отзывы',
            url: '/#reviews',
          },
          {
            title: 'О нас',
            url: '/about',
          },
        ]
      } : navigationItems[0]?.metadata

      handleContextAdd(
        categoriesGroup?.groups,
        categoriesGroup?.type,
        navigation
      )
    }

    return () => {
      isMounted = false
    }
  }, [
    categories,
    categoriesGroup,
    categoryTypes,
    handleContextAdd,
    navigationItems,
    userRole,
  ])

  return (
    <Layout navigationPaths={!userRole ? {
      menu: [
        {
          title: 'Отзывы',
          url: '/#reviews',
        },
        {
          title: 'О нас',
          url: '/about',
        },
      ]
    } : navigationItems[0]?.metadata}>
      <Description info={{
        title: "ПРОФЕССИОНАЛЬНЫЙ РЕМОНТ",
        metadata: {
          subtitle: "РЕМОНТ ПРО",
          description: "Найдите лучших мастеров для ремонта вашего дома. Быстро, качественно и по доступным ценам.",
          button: {
            text: "Наши контакты",
            onClick: () => {
              const footer = document.getElementById('footer');
              if (footer) {
                footer.scrollIntoView({ behavior: 'smooth' });
              }
            }
          }
        }
      }} />
      <HotBid classSection="section" info={categoriesGroup['groups'][0]} />
      <Partners info={reviews} />
    </Layout>
  )
}

export default Home

export async function getServerSideProps() {
  const reviews = (await getAllDataByType('reviews')) || []
  const landing = (await getAllDataByType('landings')) || []
  const categoryTypes = (await getAllDataByType('categories')) || []
  const categoriesData = await Promise.all(
    categoryTypes?.map(category => {
      return getDataByCategory(category?.id)
    })
  )
  const navigationItems = (await getAllDataByType('navigation')) || []

  const categoriesGroups = categoryTypes?.map(({ id }, index) => {
    return { [id]: categoriesData[index] }
  })

  const categoriesType = categoryTypes?.reduce((arr, { title, id }) => {
    return { ...arr, [id]: title }
  }, {})

  const categoriesGroup = { groups: categoriesGroups, type: categoriesType }

  return {
    props: {
      reviews,
      landing,
      categoriesGroup,
      categoryTypes,
      navigationItems,
    },
  }
}